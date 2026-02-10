RAG-Based Legal Assistant Chatbot

A context-aware legal assistant chatbot built using LangChain and a modular Retrieval-Augmented Generation (RAG) pipeline.

This system is designed to answer legal queries by grounding responses in relevant legal documents. It combines keyword-based retrieval and semantic vector search, dynamically choosing the best retrieval strategy based on the complexity of each query.

For multi-step or reasoning-heavy questions, the chatbot retrieves information across multiple documents and consolidates results using Reciprocal Rank Fusion (RRF) to ensure high-quality, diverse context is passed to the language model.

Key Capabilities

Automated PDF Ingestion
Parses and indexes legal PDF documents for downstream retrieval.

Hybrid Retrieval Pipeline

Sparse retrieval (BM25) for exact keyword matching

Dense retrieval (FAISS + sentence transformers) for semantic similarity

Query-Aware Retrieval Strategy
Classifies queries as simple, complex, or multi-hop and adapts retrieval logic accordingly.

Multi-Query Retrieval
Expands a single user query into multiple semantically related queries to improve recall.

Multi-Hop Retrieval
Breaks complex questions into intermediate steps and retrieves supporting context across documents.

Reciprocal Rank Fusion (RRF)
Combines results from multiple retrievers to prioritize consistently relevant documents.

Conversation Context Handling
Custom chat history module that maintains conversational continuity without relying on deprecated LangChain memory abstractions.

CLI-Based Interface
Lightweight terminal interface for interactive usage.

Legal Safety Disclaimer
Explicitly informs users that responses are not legal advice.

Tech Stack

Framework: LangChain

Embedding Model: HuggingFace all-MiniLM-L6-v2

Vector Store: FAISS

LLM: Cohere command-r

Sparse Retrieval: BM25

Document Loader: PyPDFLoader

Text Chunking: RecursiveCharacterTextSplitter

Evaluation: RAGAS

Tracing & Debugging: LangSmith

Interface: Command-line application

Requirements
Python >= 3.12
pip or uv (recommended)

Installation
Using uv (Recommended)
git clone https://github.com/RISHABH-PAWAR/RAG-based-Legal-Assistant.git
cd RAG-based-Legal-Assistant
uv sync

Using pip
git clone https://github.com/RISHABH-PAWAR/RAG-based-Legal-Assistant.git
cd RAG-based-Legal-Assistant

python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# or
.venv\Scripts\activate      # Windows

pip install -r requirements.txt

Environment Configuration

Create or edit a .env file:

COHERE_API_KEY=your_cohere_api_key
OPENAI_API_KEY=your_openai_api_key  # optional

Project Structure
RAG-based-Legal-Assistant/
├── data/                    # Legal PDF documents
├── modules/                 # Core RAG pipeline components
│   ├── bm25_retriever.py
│   ├── semantic_retriever.py
│   ├── multi_query_retriever.py
│   ├── multi_hop_retriever.py
│   ├── rrf_score.py
│   ├── decide_query_complexity.py
│   ├── conversation_history.py
│   └── chatbot_response.py
├── prompts/                 # Prompt templates
├── RAGAS-dataset/           # Evaluation datasets and scores
├── app.py                   # Application entry point
├── requirements.txt
├── pyproject.toml
└── README.md

Running the Application

Place legal PDFs inside data/raw

Start the chatbot:

uv run app.py


Ask questions in the terminal

Type exit to quit

System Overview
Document Indexing

PDFs are loaded and split into chunks

Chunks are embedded using a sentence transformer

Embeddings are stored in FAISS for fast similarity search

Retrieval Flow

Query complexity is classified

Appropriate retrieval strategies are triggered:

single retrieval

multi-query expansion

multi-hop chaining

Results from multiple retrievers are merged using RRF

Response Generation

Retrieved context is passed to the LLM

Answers are generated strictly from grounded context

Conversation history is preserved across turns

Evaluation

Retrieval and generation quality are evaluated using RAGAS, with datasets and scores stored under RAGAS-dataset/.

Developer

Rishabh Pawar
GitHub: https://github.com/RISHABH-PAWAR

Repository: https://github.com/RISHABH-PAWAR/RAG-based-Legal-Assistant
