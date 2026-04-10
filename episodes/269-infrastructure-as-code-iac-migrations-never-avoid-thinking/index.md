---
title: "Infrastructure as code: why you can never avoid thinking"
description: "Tools or frameworks? Erik dives into the challenges of infrastructure as code, infra migrations, code reviews and the perennial problem of validation."
image: ./post.png
date: 2026-04-17
custom_youtube_embed_url: https://youtu.be/HecmJoRCKoI
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Erik Osterman" link="https://www.linkedin.com/in/osterman/" image={GuestImage} brandImg={BrandImage} />
</div>

We explore the past and AI-driven future of Infrastructure as Code with Cloud Posse's Eric Osterman, discussing various IaC traumas. Erik maintains the world's largest repository of open-source IaC modules. Looking back at the dark ages of infrastructure, from the early days of raw CloudFormation and Capistrano to the rise and fall of tools like Puppet and Chef, we discuss the organic, messy growth of cloud environments. Where organizations frequently scale a single AWS account into a tangled web rather than adopting a robust multi-account architecture guided by a proper framework.

The conversation then shifts to the modern era of rapid integration of infrastructure development. While generating IaC with large language models can be incredibly fast, it introduces severe risks if left unchecked, and we explore how organizations can protect themselves by relying on Architectural Decision Records (ADRs) and predefined "skills". The hopeful goal of ensuring autonomous deployments are compliant, reproducible, and secure instead of relying on hallucinated architecture.

Finally, we tackle the compounding issue of code review in an age where developers can produce a year's worth of engineering ~~slop~~ progress in a single week.

## 💡 Notable Links:
* [Atmos framework](https://atmos.tools/)
* [Checkov - IaC Validation](https://www.checkov.io/)
* [Code Rabbit](https://www.coderabbit.ai)
* [Episode: Agent Skills](https://adventuresindevops.com/episodes/267-upskilling-your-agents-skills)
* [Episode: All about MCPs](https://adventuresindevops.com/episodes/mcp-servers-and-agent-interactions)

## 🎯 Picks:

* Warren - [Project Hail Mary](https://amzn.to/4edD5Oq)
* Erik  - [Everybody's free to wear sunscreen](https://www.youtube.com/watch?v=sTJ7AzBIJoI) & [Book: The 10X Rule](https://amzn.to/3OtQ4Ba)