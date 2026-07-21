# Know your reader — Corey J. Adams

The book is written for Corey. Tailoring it to him is the difference between prose that lands and prose that bores or loses him. This profile tells you what to assume as a shared baseline (and therefore *not* over-explain), what to motivate and connect (adjacent, not core), and how he communicates (so you can match his register). It is synthesized from his CV, Google Scholar profile, and open-source work.

## Who he is

A physicist by training, he became a **scientific machine learning (SciML) and HPC performance engineer**. He earned a PhD in Physics from Yale as an experimental and computational neutrino physicist (MicroBooNE, SBND, NEXT) who **pioneered deep learning for neutrino detectors**. He moved through Argonne (AI lead on the Aurora supercomputer, 60k+ GPUs) and a stint at AMD (AI on the ROCm/Instinct stack) into his current role as **Senior Software Engineer on PhysicsNeMo at NVIDIA**. The through-line across everything is **making AI for physics run correctly and fast at extreme scale** — the intersection of fundamental physics, large-scale distributed systems, and the software engineering that ties them together. He is simultaneously a domain scientist (h-index 40, DOE Early Career awardee) and a systems/framework builder (inventor of ShardTensor; lead architect of PhysicsNeMo's domain parallelism and datapipes).

## Assume expert — do NOT over-explain (use as shared reference points)

- **Distributed training & HPC at scale** — data/tensor/domain parallelism, FSDP, DTensor, his own ShardTensor; MPI, NCCL/RCCL/oneCCL, Slurm/PBS, scaling to tens of thousands of ranks on leadership-class machines. He *builds* the parallelism layer.
- **GPU performance engineering** — Nsight Systems, VTune, PyTorch Profiler; mixed precision, CUDA graphs, `torch.compile`, Triton, NVIDIA Warp; high-concurrency I/O with GPU stream parallelism. Speedups are his day job (30x on CAE models).
- **Deep learning architectures in practice** — CNNs, GNNs, UNet/UResNet, sparse neural networks, GANs/AEs/SimCLR, neural operators, surrogate models, transformer/attention surrogates (GeoTransolver). Segmentation, detection, classification, self-supervised representation learning.
- **Scientific ML for physical systems** — differentiable simulation, physics-constrained GNNs (networks that obey conservation laws), neural-network wavefunction ansätze, CFD/CAE surrogates. He builds models where the physics is *baked into the architecture*.
- **Scientific software engineering** — expert Python, C/C++, CUDA-Python; PyTorch (deep), JAX (deep — mpi4jax, differentiable solvers), TensorFlow/Keras; HDF5/Zarr, sparse/irregular data serialization, CI/CD, testing infra, Docker/Enroot. He owns whole framework subsystems.
- **Fundamental physics** — neutrino physics, neutrinoless double beta decay, quantum many-body physics, variational Monte Carlo, and the multibody Schrödinger equation. Liquid-argon TPCs and detector physics are home turf.
- **Applied math foundations** — differential equations, linear algebra, advanced calculus, probability/statistics, mathematical modeling.
- **Engineering & OSS** — led the PhysicsNeMo v2.0 refactor; reasons fluently about downloads, contributor dynamics, release cadence, and open-source stewardship.

**Rule:** anything involving distributed systems, GPU performance, deep-learning architectures, JAX/PyTorch internals, fundamental physics, or scientific software → assume expert, and reach for analogies from *these* domains.

## Motivate and connect — likely adjacent, not core

He learns fast and crosses fields (physics → HPC → framework engineering → CFD/CAE), so the guidance is "motivate and connect," never "he can't follow."

- **Classical numerical PDE/CFD solver internals** — he now works on CFD/CAE *surrogates* and CAE models, but the traditional solver stack (finite-volume/finite-element discretization, turbulence modeling, mesh generation theory) comes from the application side, not his training. Motivate the numerics; he'll map them to the ML surrogate fast.
- **Aerodynamics/engineering design domains** — CAE and external aerodynamics are his current application areas but arrived recently via PhysicsNeMo; give domain context rather than assuming aerodynamic intuition.
- **LLM/NLP internals as a research subject** — he uses modern DL tooling and attention-based models, but transformer *language*-model research (tokenization, RLHF, alignment, NLP architecture) is not his corpus. Motivate these.
- **Reinforcement learning** — largely absent from his work; motivate policy gradients, value functions, and exploration from first principles.
- **Formal / theoretical ML** — he's an architecture-and-systems practitioner, not a learning theorist; generalization bounds, statistical learning theory, PAC-style results → motivate their relevance.
- **Deep Bayesian machinery** — he does physics-based inference and probabilistic modeling, but full MCMC, variational inference, and Bayesian nonparametrics may be adjacent.
- **Non-physical domains** (biology, chemistry, economics/finance) → he picks them up project by project; give domain context.

**Rule:** classical CFD numerics, engineering-design domains, language models as research objects, RL, or formal ML theory → motivate, and connect back to his physics, HPC, and framework-engineering intuitions.

## How he communicates (match this register)

- **Quantitative and precise.** Everything is a measured factor: "30x speedups," "5x accuracy over SOTA," "3x monthly downloads," "60k+ GPUs," "20k+ ranks," "h-index 40." **Lead with concrete magnitudes, not adjectives.**
- **Performance framed against a baseline.** He instinctively states *what* was beaten and *on what* — "top CAE models," "beats state-of-the-art by 5x accuracy," "#2 in the world." **Always name the baseline and the workload** when you claim faster/better.
- **Systems-and-scale thinking.** He reasons from where the bottleneck is — memory limits, IO concurrency, communication collectives, single-GPU→supercomputer scaling. Give the *mechanism* behind a speedup or a scaling limit, not just the result.
- **Engineering pragmatism, shipped.** He values work that lands in a real, maintained artifact — delivered on time, adopted (downloads up), a "core capability of PhysicsNeMo." Tie methods to whether they're *robust and adoptable*, not just correct in a notebook.
- **Physics as ground truth.** A recurring theme: models that *obey fundamental physical laws* and parameters that are *interpretable physical quantities*. Frame ML choices around whether they respect the physics, not just the loss curve.
- **Open-source by default.** Nearly all his work is public (PhysicsNeMo, CosmicTagger, Larcv3, SparseEventID); he values public code, examples, and reproducible recipes.
- **A teacher and team lead.** A prolific lecturer, workshop organizer, and engineering team lead, he appreciates clear pedagogical structure and content that others can pick up and run.
- **A hands-on builder** who works across the whole stack — from C++/HDF5 data serialization up to model architecture and cross-vendor benchmarking (NVIDIA, SambaNova, Cerebras). He respects end-to-end ownership, not just the interesting middle.
- **Never in a vacuum.** Performance improvements, model architectures, frameworks, and similar advances matter only when applied to **real problems**. It does not matter how much better, faster, or smarter something is if it does not solve real problems or work on real systems. Not everything needs to be productized, but toy problems are not evidence of accomplishment; they are for teaching and exploration.
