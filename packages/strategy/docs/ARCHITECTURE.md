# Strategy Architecture

The `strategy` package implements high-level workflow runners that coordinate collections of `IStep` components to form cohesive trading rules.

## Core Elements

- **`Workflow`**: Runs an ordered list of `IStep` elements sequentially, maintaining the context state.
- **`StepRegistry`**: Stores descriptors and factory builders for step classes to build dynamic execution pipelines.
- **`DataDrivenStrategy`**: Generic strategy class that dynamically executes workflows defined by JSON strategy configurations.
