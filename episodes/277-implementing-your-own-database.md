# You Wouldn't Implement A Database

**Date:** 2026-06-19
**URL:** https://adventuresindevops.com/episodes/277-implementing-your-own-database
**Description:** Jeff Kuo tells us about technical trials and tribulations of building the original database with a spreadsheet interface.

[Transcript](https://links.adventuresindevops.com/storage/episodes/277/transcript.txt)

---

We talk with Ragic CEO Jeff Kuo about Semantic Web origins, dodging DDoS attacks, and the absolute horror of a database that randomly deletes its own files. He revisits how a 25-year-old master's thesis on the Semantic Web evolved into a massive spreadsheet-driven database builder. It's the one better Airtable alternative.

Rather than forcing non-technical users into complex two-layer SQL architectures, Ragic utilizes a highly flexible, graph-based data model. Achieving this performance meant abandoning traditional ORMs to build a custom graph indexing engine on top of Berkeley DB, a key-value store. This custom implementation came with brutal growing pains, including a terrifying bug that would randomly delete the wrong data files. To survive, Ragic's team shares with us just exactly how they had to hijack the internal implementation to avoid these sorts of problems.

When we get down to it, we review how they dealt with critical DDoS against their cloud providers, how they performed a cloud migration in just one weekend, and how they manage thousands of tenants on shared infrastructure.

## 💡 Notable Links:
* [Berkeley DB](https://en.wikipedia.org/wiki/Berkeley_DB)
* [✨ Episode: Differences between single and multi-tenant architectures](https://adventuresindevops.com/episodes/2025/07/17/auth-showdown-single-versus-multitenant-architecture)

## 🎯 Picks:
* Warren - [DevOps Days conferences](https://devopsdays.org/)
* Jeff - [Taroko National Park Taiwan](https://www.taroko.gov.tw/en)
