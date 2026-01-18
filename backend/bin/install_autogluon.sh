
#!/bin/bash
echo "Installing AutoGluon System Dependencies..."
apt-get update && apt-get install -y build-essential libatlas-base-dev libopenblas-dev

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing AutoGluon Tabular..."
# Installing minimal tabular to save space/time
pip install "autogluon.tabular"

echo "Done."
