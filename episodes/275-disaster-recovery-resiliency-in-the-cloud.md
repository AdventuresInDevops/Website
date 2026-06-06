# DR: Staying resilient in the cloud

**Date:** 2026-06-05
**URL:** https://adventuresindevops.com/episodes/275-disaster-recovery-resiliency-in-the-cloud
**Description:** Seth Eliot shares his tales of cloud resiliency, art of backups, and how recovering from a disaster may end up in a disaster.

[Transcript](https://links.adventuresindevops.com/storage/episodes/275/transcript.txt)

---

Welcome back to another hopefully, relief from architectural existential dread. This week, we've pulled in Seth Eliot from [Arpio](https://arpio.io/), (Ar-Pi-O, RPO, get it?), to dive headfirst into the beautiful, deeply expensive illusion that migrating your legacy infrastructure to a major hyperscaler magically grants it instant immortality. *It doesn't*. We break down the shared responsibility model for resilience, which was conveniently cribbed straight from the security model, and analyze how the foundational promise of automated fault isolation boundaries routinely crumbles.

From cloud providers sticking multiple "independent" availability zones inside the exact same physical building, to multi-AZ cascading anomalies, to regional power grid failures, it's clear your provider's abstractions aren't nearly as resilient as their marketing slides suggest.

Discussed within is the "Thundering Herd" phenomenon, that can't be ignored even when the failover clusters are designed correctly. From cross-organization KMS re-encryption loops to the horror of fragmented application logs across CloudFront edge regions, at the end of the day, true resilience isn't achieved by forcing your engineering team to implement features, it's about architecting your baseline, confidentiality for the inevitability of production burning to the ground.

## 💡 Notable Links:
* [✨ Episode: Eat your security vegetables](https://adventuresindevops.com/episodes/274-ai-tech-debt-spoiling-devops)
* [✨ Episode: Matt vibecodes](https://adventuresindevops.com/episodes/264-product-designers-nontechnical-vibe-coding)
* [✨ Episode: on DNS and isolation](https://adventuresindevops.com/episodes/266-dns-is-always-the-problem)

## 🎯 Picks:
* Warren - [Book: Moldable software development](https://medium.com/feenk/rewilding-software-engineering-25ba0e141e69)
* Seth - [Lockpick set](https://covertinstruments.com/products/fng-plus-bundle)
