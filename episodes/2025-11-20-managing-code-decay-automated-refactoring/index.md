---
hide_table_of_contents: true
title: "Why Your Code Dies in Six Months: Automated Refactoring"
description: "Olga Kundzich joins to discuss why cloud-native apps decay in six months due to shifting dependencies and how OpenRewrite uses Lossless Semantic Trees to automate refactoring."
image: ./post.png
date: 2025-11-20
custom_youtube_embed_url: https://youtu.be/GTM7An3GncA
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';
import SponsorCallout from '@site/src/components/sponsorCallout';
import SponsorImage from './sponsor.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: "100%" }}>
    <GuestCallout name="Olga Kundzich" link="https://www.linkedin.com/in/olgakundzich/" image={GuestImage} brandImg={BrandImage} />
    <SponsorCallout name="Incident.io" tagline="The AI incident platform" link="https://dev0ps.fyi/incidentio" image={SponsorImage} />
</div>

Warren is joined by Olga Kundzich, Co-founder and CTO of Moderne, to discuss the reality of technical debt in modern software engineering. Olga reveals a shocking statistic: without maintenance, cloud-native applications often cease to function within just six months. And from our experience, that's actually optimistic. The rapid decay isn't always due to bad code choices, but rather the shifting sands of third-party dependencies, which make up 80 to 90% of cloud-native environments.

We review the limitations of traditional Abstract Syntax Trees (ASTs) and the introduction of OpenRewrite's Lossless Semantic Trees (LSTs). Unlike standard tools, LSTs preserve formatting and style, allowing for automated, horizontal scaling of code maintenance across millions of lines of code. This fits perfectly in to the toolchain that is the LLMs and open source ecosystem. Olga explains how this technology enables enterprises to migrate frameworks—like moving from Spring Boot 1 to 2 — without dedicating entire years to manual updates.

Finally, they explore the intersection of AI and code maintenance, noting that while LLMs are great at generating code, they often struggle with refactoring and optimizing existing codebases. We highlight that agents are not yet fully autonomous and will always require "right-sized" data to function effectively. Will is absent for this episode, leaving Warren to navigate the complexities of mass-scale code remediation solo.

## 💡 Notable Links:
* [DevOps Episode: We read code](https://adventuresindevops.com/episodes/2025/10/31/managers-of-agents-ai-strategy)
* [DevOps Episode: Dynamic PRs from incidents](https://adventuresindevops.com/episodes/2025/10/20/solving-incidents-with-one-time-ephemeral-runbooks)
* [OpenRewrite](https://docs.openrewrite.org/)
* [Larger Context Windows are not better](https://www.arxiv.org/pdf/2509.21361)

## 🎯 Picks:
* Warren - [Dell XPS 13 9380](https://amzn.to/4oPEHzS)
* Olga - [Claude Code](https://www.claude.com/product/claude-code)

