import sys
print(f"Python: {sys.executable}")
try:
    import langchain
    print(f"LangChain: {langchain.__version__}")
except ImportError:
    print("LangChain not found")

try:
    from langchain.output_parsers import ResponseSchema
    print("SUCCESS: from langchain.output_parsers import ResponseSchema")
except ImportError as e:
    print(f"FAIL: langchain.output_parsers ({e})")

try:
    from langchain_core.output_parsers import ResponseSchema
    print("SUCCESS: from langchain_core.output_parsers import ResponseSchema")
except ImportError as e:
    print(f"FAIL: langchain_core.output_parsers ({e})")
