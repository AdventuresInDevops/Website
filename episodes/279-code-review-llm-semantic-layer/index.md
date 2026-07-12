---
title: "Technically We Have Code Reviews and the LLM Semantic Layer"
description: "We talk with TextQL CTO Mark Hay about spam classification at Meta, Locality of Behavior, and the correct by construction Semantic Layer."
image: ./post.png
date: 2026-07-10
custom_youtube_embed_url: https://youtu.be/TV_6u_Dp0eo
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Mark Hay" link="https://www.linkedin.com/in/mark-a-hay/" image={GuestImage} brandImg={BrandImage} />
</div>

We are joined this week by Mark Hay, CTO and co-founder of [TextQL](https://textql.com/) and former lead of Text Classification Infrastructure at Meta, to uncover the hidden complexities behind massive-scale machine learning. Mark explains why the most crucial features for identifying abusive behavior, like drug dealers or scammers on Facebook and Instagram, rarely rely on the content itself but instead analyze the underlying behavioral graphs, such as abnormal friend requests or messaging patterns.

Of course we review the adversarial nature of spam detection, where bad actors constantly evolve from simple regex evasion to embedding messages inside images or even utilizing pure symbolic communication, like comparing different sized cucumber emojis to evade text filters. That requires diving into the evolution of database querying and the rise of the semantic layer. Mark unpacks why relying on raw LLMs to write complex SQL is a recipe for hallucinations, and how implementing a "correct by construction" semantic layer guarantees structurally sound queries by restricting outputs to a strictly defined configuration. However, this rigid structure fundamentally stifles the creative flexibility of LLMs.

Lastly, we can't avoid exploring the tension between these approaches and how new tools aim to bridge the gap by dynamically balancing raw SQL generation with structured ontological constraints, providing rapid time-to-value for analytical workflows. Finally, we discuss the controversial philosophical shift occurring within software engineering, particularly the tension between the "Don't Repeat Yourself" principle and "Locality of Behavior".


## 💡 Notable Links:
* [✨ Episode: Semantic Search](https://adventuresindevops.com/episodes/2025/09/24/the-introduction-to-vector-databases)
* [✨ Episode: Formal Verification](https://adventuresindevops.com/episodes/272-human-value-versus-ai-generated-legacy-code/)
* [✨ Episode: Subjective Model Embeddings](https://adventuresindevops.com/episodes/273-model-embedding-data-pipelining)

## 🎯 Picks:
* Warren - [Article: I Left Port 22 Open on the Internet for 54 Days](https://arman-bd.hashnode.dev/i-left-port-22-open-on-the-internet-for-54-days-here-s-who-showed-up)
* Mark - [Hotel Room Exercise: Burpies](https://www.youtube.com/watch?v=auBLPXO8Fww)
