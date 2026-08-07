---
title: "Why does anyone use Crossplane?"
description: "Pushkar shares why teams switch to Crossplane and the perils of misaligned organizational incentives."
image: ./post.png
date: 2026-08-07
custom_youtube_embed_url: https://youtu.be/zqYpoFe2t6g
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Pushkar Gopalakrishna" link="https://www.linkedin.com/in/pushkar-gopalakrishna-a5a3a14" image={GuestImage} brandImg={BrandImage} />
</div>

Pushkar Gopalakrishna, Senior Staff Software Engineer at Snap, previously Cruise and AWS, joins to explore why engineering organizations pivot away from Terraform and HCL toward Kubernetes-native tools even when they might not be better. We unpack how developer friction, copy-pasted control structures, and misaligned organizational incentives create massive tech debt—often forcing SREs to manually update infrastructure repositories for compliance, resulting in broken pipelines and severe operational friction.

We debate over the mechanics of Crossplane, detailing how its continuous reconciliation loop and Custom Resource Definitions (CRDs) allow teams to express cloud infrastructure as YAML alongside their application manifests at potentially the cost of async validation. Pushkar pulls back the curtain on how Cruise managed infrastructure at scale using a custom internal platform called 'Juno' to bootstrap GCP projects, repositories, and permissions, while leveraging Crossplane for application-level resources. We also dive into the dangers of using CI tools for continuous deployment, detailing a terrifying incident where a pipeline bug accidentally marked three production Kubernetes namespaces for deletion, and how moving to ArgoCD and Argo Rollouts helped prevent future outages for autonomous vehicles.

Finally, we touch on the realities of non-production environment isolation, testing against live APIs, and why platform teams must balance providing a seamless developer experience without stripping away developer accountability.

---

## 💡 Notable Links:
* [Crossplane](https://www.crossplane.io/)
* [Podcast Guest Request for Principal Engineer — What work are you doing?](https://adventuresindevops.com/docs/guests)
* [Amazon Multi-level fullyment center for drones](https://dronecenter.bard.edu/files/2017/09/CSD-Amazons-Drone-Patents-1.pdf)
* [✨ Episode: Terraform vs OpenTofu](https://adventuresindevops.com/episodes/269-infrastructure-as-code-iac-migrations-never-avoid-thinking)

## 🎯 Picks:
* Warren - [Books: The Murderbot Diaries](https://amzn.to/4wjDcxx)
* Pushkar - [DJI mini drone](https://amzn.to/3TIVWc6)