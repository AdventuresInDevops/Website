---
title: "Who needs a server?"
description: "Lena Fuhrimann joins us to talk about all things serverless, having fun with infrastructure, and why we can't ignore the human factor."
image: ./post.png
date: 2026-05-01
episode_number: 271
custom_youtube_embed_url: https://youtu.be/FD-8QWGV7Fs
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Lena Fuhrimann" link="https://www.linkedin.com/in/lena-fuhrimann/" image={GuestImage} brandImg={BrandImage} />
</div>

Founder of Bespinian and long-time cloud solutions architect, Lena Fuhrimann, sits down with us to clarify the widespread confusion around serverless architecture. We discuss how serverless is often incorrectly equated solely with Function as a Service (FaaS), when it actually represents a broader spectrum on the abstraction ladder—including managed AI inference, container platforms, and databases.

Lena shares her early career traps of building a fragmented landscape of sixty "nano-services" and explains why starting with a well-architected monolith and progressively breaking out microservices based on distinct resource or lifecycle requirements is a much saner approach.  Then we shift to drivers behind cloud migrations, emphasizing that the primary financial benefit of serverless isn't necessarily shrinking the monthly cloud provider bill, but rather optimizing your most expensive resource: engineering time. By offloading mundane infrastructure patching to the cloud provider, teams can focus entirely on delivering tangible business value to customers. But cost is still there too. 

We also explore the psychological challenges of adopting new paradigms, sharing a fascinating story of bridging the gap for a VM-loving engineer by introducing immutable infrastructure concepts through Packer and Ansible before fully transitioning them to containers. And of course we tackle the dreaded topic of "cold starts" and why complex workarounds—like building custom Lambda warmers to periodically call APIs—often defeat the core benefits of reduced total cost of ownership.

## 💡 Notable Links:
* [Bespinian](https://bespinian.io/)
* [Book: Drive — Motivation 3.0](https://amzn.to/3OJjzPI)
* [✨ Episode: Typed Languages, Haskell, and building monoliths](https://adventuresindevops.com/episodes/270-ci-cd-building-monoliths-the-right-way)

## 🎯 Picks:
* Warren - [Better thank coffee: Himmelstau tea](https://teehaus.ch/sortiment/alle-tees/)
* Lena - [Home Assistant open source project](https://www.home-assistant.io/) and [Awtrix Clocks](https://github.com/blueforcer/awtrix3)