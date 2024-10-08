import json
import pandas as pd
from kobert_transformers import get_kobert_model, get_tokenizer
from torch.nn.utils.rnn import pad_sequence
import torch
import torch.nn as nn
import numpy as np
import collections


class GRUScoreModule(nn.Module):
    def __init__(self,output_dim, hidden_dim ,ukt_a_dim = 147, dropout=0.5):
        super(GRUScoreModule, self).__init__()
        
        self.gru = nn.GRU(768, hidden_dim, dropout=dropout, batch_first=True, bidirectional=True)
        self.ukt_a_fc = nn.Linear(ukt_a_dim*2, hidden_dim)
        self.attention = nn.Linear(ukt_a_dim,ukt_a_dim)
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim*3, output_dim)
        self.sigmoid = nn.Sigmoid()
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x, ukt_a):
        x, _ = self.gru(x)
        
        x = x[:, -1, :]  # Use the output of the last time step

        ukt_a_attention = self.attention(ukt_a)
        attention_weights = self.softmax(ukt_a_attention)
        weighted_ukt_a = attention_weights * ukt_a
        concat_weighted_ukta = torch.cat((weighted_ukt_a, ukt_a), dim=1)
        ukt_a_features = self.ukt_a_fc(concat_weighted_ukta)
        combined = torch.cat((x,ukt_a_features), dim=1)

        combined = self.dropout(combined)
        combined = self.fc(combined)
        output = self.sigmoid(combined)
        
        return output, attention_weights


def scoring(bert_model, gru_model, extracted_features, tokenizer):
	device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
	sentences = [
		sent["text"]["content"] for sent in extracted_features["morpheme"]["sentences"]
	]

	# 자질 추출
	sample_essay_features = []
	keys = ["ttr", "similarity", "adjacency", "basic_count", "basic_density", "NDW"]
	
	for key in keys:
		if len(extracted_features[key]) > 0:
			sample_essay_features.extend(list(extracted_features[key].values()))
		else:
			sample_essay_features.extend([0]*42)


	scaler = pd.read_csv(
		"./apps/cohesion/essay_scoring/features/scaler.csv", encoding="cp949"
	)

	feature_list = scaler['feature'].to_list()

	# Ensure mean and scale are numeric
	scaler["mean"] = pd.to_numeric(scaler["mean"], errors="coerce")
	scaler["scale"] = pd.to_numeric(scaler["scale"], errors="coerce")

	# Initialize lists to store scaled features
	mean = scaler['mean'].to_numpy()
	scale = scaler['scale'].to_numpy()
	scaled_features = (np.array(sample_essay_features) - mean)/scale
	scaled_features = torch.tensor([scaled_features], dtype=torch.float32)

	# bert 모델 문장별 임베딩 추출
	max_length = 50
	inputs = tokenizer.batch_encode_plus(
		sentences, max_length=max_length, padding="max_length", truncation=True
	)
	input_ids = torch.tensor(inputs["input_ids"]).to(bert_model.device)
	attention_mask = torch.tensor(inputs["attention_mask"]).to(bert_model.device)
	out = bert_model(input_ids=input_ids, attention_mask=attention_mask)
	embedded_features = out[0].detach().cpu()[:, 0, :]

	# Convert list of numpy arrays to a single numpy array
	embedded_features = np.array(embedded_features)

	# Convert numpy array to tensor
	embedded_features = torch.tensor(embedded_features, dtype=torch.float32)

	# Pad the sequences
	max_len = 128
	if embedded_features.size(0) > max_len:
		embedded_features = embedded_features[-max_len:]  # Truncate from the beginning
	else:
		padding = torch.zeros(
			(max_len - embedded_features.size(0), embedded_features.size(1))
		)
		embedded_features = torch.cat(
			(padding, embedded_features), dim=0
		)  # Pad at the beginning

	embedded_features = embedded_features.unsqueeze(0)  # Add batch dimension

	# 점수 및 attention 추출
	gru_model.eval()
	output, attention = gru_model(
		embedded_features.to(device), scaled_features.to(device)
	)
	output = np.rint(output[0].detach().cpu().numpy() * 3).astype(int)
	attention = attention[0].detach().cpu().numpy()
	top_k_features = get_topK_features(attention, np.array(feature_list))

	return output, top_k_features


def get_topK_features(attention, feature_list, k=10):
	sorted_attention = np.argsort(attention)[::-1]
	top_k_feautres = feature_list[sorted_attention[:k]]
	return top_k_feautres


def score_results(extracted_features):
	device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
	bert_model = get_kobert_model().to(device)
	tokenizer = get_tokenizer()
	gru_model = GRUScoreModule().to(device)
	gru_model.load_state_dict(torch.load("./apps/cohesion/essay_scoring/model/gru_scorer.pth"))
	output, top_k_features = scoring(bert_model, gru_model, extracted_features, tokenizer)

	rubric = [
		"grammar",
		"vocabulary",
		"sentence_expression",
		"intra-paragraph_structure",
		"inter-paragraph_structure",
		"structural_consistency",
		"length",
		"topic_clarity",
		"originality",
		"prompt_comprehension",
		"narrative",
	]

	score_results = collections.defaultdict()
	for i in range(11):
		score_results[rubric[i]] = output[i]

	score_results["top_k_features"] = top_k_features

	for key, value in score_results.items():
		if isinstance(value, np.generic):
			score_results[key] = value.item()
		elif isinstance(value, np.ndarray):
			score_results[key] = value.tolist()

	return score_results


if __name__ == "__main__":

	# extracted_features = process(text)
	with open("./example/ESSAY_51802.json", "r", encoding="utf-8-sig") as f:
		extracted_features = json.load(f)
	f.close()

	# 자질 상세 정보
	with open("./features/features_info.json", "r", encoding="utf-8-sig") as f:
		features_info = json.load(f)
	f.close()

	# 임베딩 모델
	device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
	bert_model = get_kobert_model().to(device)
	tokenizer = get_tokenizer()

	# scoring 모델
	gru_model = GRUScoreModule().to(device)
	gru_model.load_state_dict(torch.load("./model/gru_scorer.pth"))

	# 글 점수 및 top-k 자질 출력
	output, top_k_features = scoring(bert_model, gru_model, extracted_features)

	rubric = [
		"문법",
		"단어",
		"문장 표현",
		"문단 내 구조의 적절성",
		"문단 간 구조의 적절성",
		"구조의 일관성",
		"분량",
		"주제의 명료성",
		"참신성",
		"프롬프트 독해력",
		"서술력",
	]

	print(output)
	print(top_k_features)

	# print("-score-")
	# for i in range(11):
	#     print(rubric[i] + " : " + str(output[i]) + "/3")

	# print()

	# print("-attention-")
	# for i in range(10):
	#     print(top_k_features[i] + " : " + str(features_info[top_k_features[i]]))
