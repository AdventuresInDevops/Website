---
title: "DevOps trifecta: documentation, reliability, and feature flags"
description: "Melinda Fekete talks about her love of documentation in the age of LLMs, reliability challenges, and using feature flags when building a feature flag platform."
image: ./post.png
date: 2026-02-20
custom_youtube_embed_url: https://youtu.be/CSwZiHW7TkA
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Melinda Fekete" link="https://www.linkedin.com/in/melindafekete/" image={GuestImage} brandImg={BrandImage} />
</div>

We dive into the shifting landscape of developer relations and the new necessity of optimizing documentation for both humans and LLMs. Melinda Fekete joins from [Unleash](https://docs.getunleash.io/), and suggests transitioning to platform to help get this right by utilizing LLMs.txt files to cleanly expose content to AI models.

The conversation then takes a look at the June GCP outage, which was triggered by a single IAM policy change. This illustrates that even with world-class CI/CD pipelines, deploying code using runtime controls such as feature flags is still risky. Feature flags can't even save GCP and other cloud providers, so what hope do the rest of us have.

Finally, we discuss the practical implementation of these systems, advocating for "boring technology" like polling over streaming to ensure reliability, and conducting internal "breakathons" to test features before a full rollout.

## 💡 Notable Links:
* [Diátaxis - Who is article this for?](https://diataxis.fr/)
* [Fern - Docs Platform](https://buildwithfern.com/)
* [CloudFlare - Feature Flag causes outage](https://blog.cloudflare.com/18-november-2025-outage/)
* [AWS - Graceful degredation](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/reliability.html)
* [Building for 5 nines reliability](https://authress.io/knowledge-base/articles/2025/11/01/how-we-prevent-aws-downtime-impacts)
* [Episode: Latency is always more important than freshness](https://adventuresindevops.com/episodes/261-creative-practical-unconventional-engineering)
* [Episode: DORA 2025 Report](https://adventuresindevops.com/episodes/260-dora-report-ai-and-platform-engineering)

## 🎯 Picks:
* Warren - [Show: Bosch - LA Detective procedural](https://www.imdb.com/title/tt3502248/)
* Melinda - [Wavelength - Party Game](https://www.wavelength.zone/)