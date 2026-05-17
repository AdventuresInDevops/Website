# Automatic Data Pipelining: One More Turtle Ahead

**Date:** 2026-05-15
**URL:** https://adventuresindevops.com/episodes/273-model-embedding-data-pipelining
**Description:** We sit down with Corvic CTO Donald Nguyen to explore enterprise data hoarding, subjective embeddings, Firecracker VMs, and the nightmare of securing AI agents.

[Transcript](https://links.adventuresindevops.com/storage/episodes/273/transcript.txt)

---

We grabbed Donald Nguyen, co-founder and CTO at Corvic, to discuss the absurd complexities of enterprise data and multimodal inference. We explore how organizations habitually hoard mountains of useless, "dead" data just out of the sheer fantascy that someone might ask for it later. We highlight the fundamental disconnect where data collectors using tools like Airbyte and Kafka speak a completely different language than the business consumers analyzing it in Excel.

True scale isn't just about managing petabytes; it's the absolute nightmare of extracting subjective business meaning from flat PDFs and invoices. In the deep-end of vector embeddings, we're challenging translating data into a different semantic universe requires imposing a heavy business bias. Auditors and artists will view the exact same invoice completely differently, meaning your embedding model selection is incredibly subjective to the business context.

The industry's desperate search for actual AI success stories beyond basic workflow automation is still ongoing as we laugh—and cry—at the reality that companies are likely budgeting 50% of an engineer's salary for LLM token usage, effectively enabling product managers to burn cash on infinite loops to generate prototype code. Reasonable or unreasonable?

And lastly, we tackle the existential dread of securing autonomous AI agents. Because fine-grained access control for agent actions is basically an unsolved fantasy, we must treat their execution environments as entirely untrusted, relying on rigid sandboxes like AWS Firecracker VMs. Prompt injection attacks are an inevitable flaw of the transformer architecture, and the industry's best defense mechanism seems to be wrapping models inside of other models to validate the outputs. It is quite literally turtles all the way down, and the winner of enterprise security is simply the organization that manages to put one more turtle ahead of the attackers.  

## 💡 Notable Links:
* [Kuuk Thaayorre Aboriginal Tribe - Cardinal Directions](https://www.youtube.com/watch?v=RKK7wGAYP6k)
* [✨ Episode: Generating automatic integrations at scale](https://adventuresindevops.com/episodes/mcp-servers-and-agent-interactions)

## 🎯 Picks:
* Warren - [Dr. NEMO: Clockwise circle pit](https://www.youtube.com/watch?v=r8IJbUkRZ4w)
* Donald - [Book: InvestiGators](https://amzn.to/4dqhW1n)
