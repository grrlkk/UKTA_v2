import json
import pandas as pd
from kobert_transformers import get_kobert_model, get_tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import torch
import torch.nn as nn
import numpy as np

class GRUScoreModule(nn.Module):
    def __init__(self,output_dim=11,hidden_dim=128 ,ukt_a_dim=294, dropout=0.5):
        super(GRUScoreModule, self).__init__()
        
        self.gru = nn.GRU(768, hidden_dim, dropout=dropout, batch_first=True, bidirectional=True)
        self.ukt_a_fc = nn.Linear(ukt_a_dim, hidden_dim)
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

        ukt_a_features = self.ukt_a_fc(weighted_ukt_a)
        combined = torch.cat((x,ukt_a_features), dim=1)

        combined = self.dropout(combined)
        combined = self.fc(combined)
        output = self.sigmoid(combined)
        
        return output, attention_weights


def scoring(bert_model,gru_model,extracted_features):
	
	# 원문을 문장별로 분리
	sentences = [sent['text']['content'] for sent in extracted_features["morpheme"]["sentences"]]
	
	# 자질 추출
	sample_essay_features = []
	feature_list = []
	keys = ['ttr', 'similarity', 'adjacency', 'basic_count', 'basic_density', 'NDW']
	for key in keys:
		sample_essay_features = sample_essay_features + list(extracted_features[key].values())
		feature_list = feature_list + list(extracted_features[key].keys())
	
	scaler = pd.read_csv('./features/scaler.csv',encoding='cp949')


	mean = scaler['mean'].to_numpy()
	scale = scaler['scale'].to_numpy()
	scaled_features = (np.array(sample_essay_features) - mean)/scale
	scaled_features = torch.tensor([scaled_features], dtype=torch.float32)

	# bert 모델 문장별 임베딩 추출
	max_length = 50
	inputs = tokenizer.batch_encode_plus(sentences,max_length=max_length, padding='max_length', truncation=True)
	input_ids = torch.tensor(inputs['input_ids']).to(device)
	attention_mask = torch.tensor(inputs['attention_mask']).to(device)
	out = bert_model(input_ids=input_ids,attention_mask=attention_mask)
	embedded_features = out[0].detach().cpu()[:, 0, :].numpy()
	embedded_features = torch.tensor(pad_sequences([embedded_features], maxlen=128, padding='pre', dtype='float32'), dtype=torch.float32)

	# 점수 및 attention 추출
	gru_model.eval()
	output, attention = gru_model(embedded_features.to(device), scaled_features.to(device))
	output = np.rint(output[0].detach().cpu().numpy()*3).astype(int)
	attention = attention[0].detach().cpu().numpy()
	top_k_features = get_topK_features(attention,np.array(feature_list))
	
	return output, top_k_features


def get_topK_features(attention, feature_list, k = 10):
	sorted_attention = np.argsort(attention)[::-1]
	top_k_feautres = feature_list[sorted_attention[:k]]
	
	return top_k_feautres

if __name__ == "__main__":  
	
	# extracted_features = process(text)
	with open('./example/ESSAY_51802.json','r',encoding='utf-8-sig') as f:
		extracted_features = json.load(f)
	f.close()

	# 자질 상세 정보
	with open('./features/features_info.json','r',encoding='utf-8-sig') as f:
		features_info = json.load(f)
	f.close()

	# 임베딩 모델
	device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
	bert_model = get_kobert_model().to(device)
	tokenizer = get_tokenizer()

	# scoring 모델
	gru_model = GRUScoreModule().to(device)
	gru_model.load_state_dict(torch.load('./model/gru_scorer.pth'))

	# 글 점수 및 top-k 자질 출력
	output, top_k_features = scoring(bert_model, gru_model, extracted_features)



	rubric = ["문법" , "단어", "문장 표현", "문단 내 구조의 적절성", "문단 간 구조의 적절성", "구조의 일관성", "분량", "주제의 명료성", "참신성", "프롬프트 독해력", "서술력"]
	
	print('-score-')
	for i in range(11):
		print(rubric[i] + ' : ' + str(output[i])+'/3')

	print()

	print('-attention-')
	for i in range(10):
		print(top_k_features[i] + ' : ' + str(features_info[top_k_features[i]]))

      


