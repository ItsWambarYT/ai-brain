# {{PROJECT_NAME}} — Claude Instructions

## Project Overview

{{PROJECT_NAME}} is a Python data science / machine learning project.{{BRAIN_SNIPPET}}

## Architecture

- **Language:** Python 3.11+ with strict type hints
- **Core libs:** pandas / polars, numpy, matplotlib / seaborn{{EXTRA_STACK}}
- **Package manager:** {{PACKAGE_MANAGER}}

## Directory Structure

```
data/
  raw/                  # Original, immutable data — never modify
  interim/              # Transformed but not final
  processed/            # Final, analysis-ready datasets
  external/             # External data sources
notebooks/              # Jupyter notebooks (numbered: 01_eda.ipynb)
src/
  {{PACKAGE_SLUG}}/
    data/               # Data loading + preprocessing
    features/           # Feature engineering
    models/             # Model training and evaluation
    visualization/      # Plotting helpers
    utils.py            # Shared utilities
scripts/                # Standalone scripts (train.py, evaluate.py)
models/                 # Serialized model artifacts
reports/                # Generated analysis, figures, HTML
tests/
```

## Coding Standards

- All functions have full type annotations — no `Any`
- No bare `except:` — catch specific exceptions
- Reproducibility: set random seeds at top of every script (`random.seed`, `np.random.seed`, `torch.manual_seed`)
- Use `pathlib.Path` — never string concatenation for file paths
- Use `logging` (not `print`) in scripts and modules
- Notebooks are for exploration only — production code goes in `src/`

## Data Handling

- Raw data is read-only — transformations always produce a new file/frame
- Document every transformation step with a comment explaining the business reason
- Large datasets: use chunked reading (`pd.read_csv(chunksize=...)` or Polars lazy frames)
- Validate data schemas at load time with Pandera or Great Expectations
- Never hardcode file paths — use `pathlib.Path(__file__).parents[n] / "data"`

## Models

- Experiment tracking: MLflow or Weights & Biases — every run logged
- Model versioning: save with a timestamp + git hash in the filename
- Always evaluate on a held-out test set — never tune on test data
- Persist models with `joblib` (sklearn) or `torch.save`

## Notebooks

- Number notebooks sequentially: `01_eda.ipynb`, `02_feature_engineering.ipynb`
- Restart kernel and run all cells before committing
- Clear outputs before committing (or use `nbstripout`)
- Keep notebooks short — complex logic lives in `src/`, not cells

## Testing

- Run: `pytest -v`
- Test data transformations with small synthetic DataFrames
- Test models with tiny datasets to verify training doesn't crash

## Common Commands

```bash
{{PYTHON}} -m jupyter lab                     # start Jupyter
{{PYTHON}} scripts/train.py                   # train model
{{PYTHON}} -m pytest -v                       # tests
{{PYTHON}} -m ruff check . --fix              # linting
{{PYTHON}} -m mypy src/                       # type checking
dvc repro                                     # reproduce pipeline (if DVC used)
```

## Environment

- All dependencies pinned in `requirements.txt` or `pyproject.toml`
- Create virtualenv: `python -m venv .venv && source .venv/bin/activate`
- GPU training: check CUDA version matches torch wheel
- Secrets (API keys, DB passwords) in `.env` — never in notebooks or code
