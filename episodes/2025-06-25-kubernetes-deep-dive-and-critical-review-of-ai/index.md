---
hide_table_of_contents: true
title: "Should We Be Using Kubernetes: Did the Best Product Win?"
description: "A critical look at Kubernetes' dominance and was AI a mistake? Find out with Omer Hamerman."
image: ./post.png
date: 2025-06-25
custom_youtube_embed_url: https://youtu.be/xb7bdBL1o-Y
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpeg';
import BrandImage from './brand.jpeg';

import SponsorCallout from '@site/src/components/sponsorCallout';
import SponsorImage from './sponsor.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Omer Hamerman" link="https://www.linkedin.com/in/omer-hamerman" image={GuestImage} brandImg={BrandImage} />
    <SponsorCallout name="PagerDuty" tagline="Their official feature release" link="https://dev0ps.fyi/pagerduty" image={SponsorImage} />
</div>

This episode dives into a fundamental question facing the DevOps world: Did Kubernetes truly win the infrastructure race because it was the best technology, or were there other, perhaps less obvious, factors at play? Omer Hamerman joins Will and Warren to take a hard look at it. Despite the rise of serverless solutions promising to abstract away infrastructure management, Omer shares that Kubernetes has seen a surge in adoption, with potentially 70-75% of corporations now using or migrating to it. We explore the theory that human nature's preference for incremental "step changes" (Kaizen) over disruptive "giant leaps" (Kaikaku) might explain why a solution perceived by some as "worse" or more complex has gained such widespread traction.

The discussion unpacks the undeniable strengths of Kubernetes, including its "thriving community", its remarkable extensibility through APIs, and how it inadvertently created "job security" for engineers who "nerd out" on its intricacies. We also challenge the narrative by examining why serverless options like AWS Fargate could often be a more efficient and less burdensome choice for many organizations, especially those not requiring deep control or specialized hardware like GPUs. The conversation highlights that the perceived "need" for Kubernetes' emerges often from something other than technical superiority.

Finally, we consider the disruptive influence of AI and "vibe coding" on this landscape, how could we not? As LLMs are adopted to "accelerate development", they tend to favor serverless deployment models, implicitly suggesting that for rapid product creation, Kubernetes might not be the optimal fit. This shift raises crucial questions about the trade-offs between development speed and code quality, the evolving role of software engineers towards code review, and the long-term maintainability of AI-generated code. We close by pondering the broader societal and environmental implications of these technological shifts, including AI's massive energy consumption and the ongoing debate about centralizing versus decentralizing infrastructure for efficiency.

## 💡 Notable Links:
- [Comparison: Linux versus E. coli](https://www.nationalgeographic.com/science/article/linux-versus-e-coli)

## 🎯 Picks:
- Warren - Surveys are great, and also fill in the [Podcast Survey](https://adventuresindevops.com/survey)
- Will - [Katana.network](https://katana.network/)
- Omer - [Mobland](https://www.imdb.com/title/tt31510819/) and [JJ (Jujutsu)](https://jj-vcs.github.io/jj/latest/) 

<div className="image-md">

![What vibe coders were doing before AI](./vibe-coders.jpeg)

</div>