"""
Embedding module for text data using a SentenceTransformer model.
"""

from sentence_transformers import SentenceTransformer

# Load the embedding model
model = SentenceTransformer("nomic-ai/nomic-embed-text-v1", trust_remote_code=True)


# Define a function to generate embeddings
def get_embedding(data, precision="float32"):
    """
    Generate embeddings for the given input data.

    Args:
        data (str): The input text
        precision (str, optional): Precision format for the output embeddings

    Returns:
        List[float]: The generated embedding(s) as a list
    """
    return model.encode(data, precision=precision).tolist()
