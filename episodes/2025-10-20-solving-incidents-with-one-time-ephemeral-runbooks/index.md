---
custom_slug: solving-incidents-with-one-time-ephemeral-runbooks
hide_table_of_contents: true
title: "Solving incidents with one-time ephemeral runbooks"
description: "Lawrence Jones reveals just how incident.io is automatically diagnosing production issues, talks about everything from running customer code on virtual machines to creating one-time runbooks for any incident."
image: ./post.png
date: 2025-10-20
custom_youtube_embed_url: https://youtu.be/VCkrYHfnW0s
---

<small>

_[Transcript available](./transcript.txt)_

</small>

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';
import SponsorCallout from '@site/src/components/sponsorCallout';
import SponsorImage from './sponsor.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: "100%" }}>
    <GuestCallout name="Lawrence Jones" link="https://www.linkedin.com/in/lawrence2jones" image={GuestImage} brandImg={BrandImage} />
    <SponsorCallout name="Attribute" tagline="FinOps without Tagging" link="https://dev0ps.fyi/attribute" image={SponsorImage} />
</div>


In this episode, we're joined by Lawrence Jones, Founding Engineer at Incident.io. The conversation focuses on the challenges of managing incidents in highly regulated environments like FinTech, where the penalties for downtime are harsh and require a high level of rigor and discipline in the response process. Lawrence details the company's evolution, from running a monolithic Go binary on Heroku to moving to a more secure, robust setup in GCP, prioritizing the use of native security primitives like GCP Secret Manager and Kubernetes to meet the obligations of their growing customer base.

We spotlight exactly how a system can crawl GitHub pull requests, Slack channels, telemetry data, and past incident post-mortems to dynamically generate an ephemeral runbook for the current incident.Also discussed are the technical challenges of using RAG (Retrieval-Augmented Generation), noting that they rely heavily on pre-processing data with tags and a service catalog rather than relying solely on less consistent vector embeddings to ensure fast, accurate search results during a crisis.

Finally, Lawrence stresses that frontier models are no longer the limiting factor in building these complex systems; rather, success hinges on building structured, modular systems, and doing the hard work of defining objective metrics for improvement.


## Notable Facts
* [Cloud Secrets management at scale](https://authress.io/knowledge-base/academy/topics/credential-management)
* [Episode: Solving Time Travel in RAG Databases](https://adventuresindevops.com/episodes/2025/09/17/chosing-the-best-database-for-ml/)
* [Episode: Does RAG Replace keyword search?](https://adventuresindevops.com/episodes/2025/09/24/the-introduction-to-vector-databases/)

## Picks:
* Warren - [Anker Adpatable  Wall-Charger - PowerPort Atom III](https://amzn.to/47hveKK)
* Lawrence - Rocktopus & [The Checklist Manifesto](https://amzn.to/47v4jwa)

<div className="image-md">

![The Rocktopus 3D printed Model](./rocktopus.jpg)

</div>
