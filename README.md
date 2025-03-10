# UKTA Web  

## Unified Korean Text Analyzer  

![UKTA_01_Input](https://github.com/user-attachments/assets/56540368-836a-47c0-958c-0e2a6099277d) 

## Morpheme Analysis  

![UKTA_02_Morpheme](https://github.com/user-attachments/assets/e36eca01-c0ff-49da-a7ae-07ec3880e209)

#### Objective

- Accurate segmentation of Korean morphemes
- Challenging due to agglutinative nature (frequent morphological changes) 
- Errors propagate and negatively affect higher-level analyses

#### Approach 

- Utilize a state-of-the-art Korean morpheme analyzer
- Minimize errors in morpheme analysis
- Powered by [Bareun](https://bareun.ai/)

## Mid-Level Analysis  

![UKTA_03_Features](https://github.com/user-attachments/assets/275b350f-4a42-4110-9245-1b41e8bbc870)

#### Objective

- Extract diverse linguistic features from morpheme level to sentence, paragraph level features 

#### Approach

- Over 294 numerical features, categorized as
- Basic features: morpheme counts, density, lengths 
- Lexical diversity:
  - Type-Token Ratios (TTR, RTTR, CTTR) 
  - MSTTR, MTLD, HD-D, VocD
- Cohesion features: semantic similarity, topic consistency, etc.

## Writing Evaluation

![UKTA_04_Writing Eval](https://github.com/user-attachments/assets/b6312959-16dc-448f-b0cd-f8d5bc12da45)

#### Objective

- Produce explainable, rubric-based writing scores

#### Approach

- Predict 10 rubric scores per essay using attention-based deep learning model 
- Combines
  - Sentence-level representations (contextual meaning via pre-trained LM + BiGRU)
  - Essay-level features (lexical and cohesion metrics) 
- Explainability through attention 
- Identifies which essay-level features most influence final scores 
- Provides transparency and reliability to users 
