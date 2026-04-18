# Solving incidents with one-time ephemeral runbooks

**Date:** 2025-10-20
**URL:** https://adventuresindevops.com/episodes/2025/10/20/solving-incidents-with-one-time-ephemeral-runbooks
**Description:** Lawrence Jones reveals just how incident.io is automatically diagnosing production issues, talks about everything from running customer code on virtual machines to creating one-time runbooks for any incident.

[Transcript](https://links.adventuresindevops.com/storage/episodes/255/transcript.txt)

---

In the wake of one of the worst AWS incidents in history, we're joined by Lawrence Jones, Founding Engineer at Incident.io. The conversation focuses on the challenges of managing incidents in highly regulated environments like FinTech, where the penalties for downtime are harsh and require a high level of rigor and discipline in the response process. Lawrence details the company's evolution, from running a monolithic Go binary on Heroku to moving to a more secure, robust setup in GCP, prioritizing the use of native security primitives like GCP Secret Manager and Kubernetes to meet the obligations of their growing customer base.

We spotlight exactly how a system can crawl GitHub pull requests, Slack channels, telemetry data, and past incident post-mortems to dynamically generate an ephemeral runbook for the current incident.Also discussed are the technical challenges of using RAG (Retrieval-Augmented Generation), noting that they rely heavily on pre-processing data with tags and a service catalog rather than relying solely on less consistent vector embeddings to ensure fast, accurate search results during a crisis.

Finally, Lawrence stresses that frontier models are no longer the limiting factor in building these complex systems; rather, success hinges on building structured, modular systems, and doing the hard work of defining objective metrics for improvement.

## 💡 Notable Links:
* [Cloud Secrets management at scale](https://authress.io/knowledge-base/academy/topics/credential-management)
* [Episode: Solving Time Travel in RAG Databases](https://adventuresindevops.com/episodes/2025/09/17/chosing-the-best-database-for-ml/)
* [Episode: Does RAG Replace keyword search?](https://adventuresindevops.com/episodes/2025/09/24/the-introduction-to-vector-databases/)

## 🎯 Picks:
* Warren - [Anker Adpatable  Wall-Charger - PowerPort Atom III](https://amzn.to/47hveKK)
* Lawrence - Rocktopus & [The Checklist Manifesto](https://amzn.to/47v4jwa)

![The Rocktopus 3D printed Model](./rocktopus.jpg)
