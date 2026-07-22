---
title: "When knowledge is free but the infrastructure isn't"
description: "How to provide free knowledge for humans and bots without killing your infrastructure? Moriel Schottlender from Wikimedia joins us to talk about the reality of maintaining a community-based open source platform at scale in the age of LLMs."
image: ./post.png
date: 2026-07-24
custom_youtube_embed_url: https://youtu.be/tc9hR5N1_JU
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpg';
import BrandImage from './brand.jpg';

<div style={{ display: "flex", justifyContent: 'space-around', alignItems: 'center', flexWrap: "wrap", maxWidth: '100%'  }}>
    <GuestCallout name="Moriel Schottlender" link="https://moriel.tech" image={GuestImage} brandImg={BrandImage} />
</div>

As it turns out, the entire artificial intelligence boom is essentially running on Wikipedia's free labor, but while knowledge is free, physical server infrastructure definitely is not. We sit down with Moriel Shotlander, Principal Systems Software Engineer at the Wikimedia Foundation, to dissect how public systems survive an endless onslaught of high-volume AI scrapers and aggressive crawlers. Because 65% of the resource-heavy requests originate from automated bots, we explore how Wikimedia navigates this traffic without blocking legitimate users. We skip the approaches of IP-banning which doesn't work in practice and discuss actual mature architectural strategies, by focusing on the users' needs. From structured database dumps and high-volume enterprise APIs to rate-limiting and CDN caching trade-offs.

It's a mind-bogglingly complex ecosystem ­of open-source, a 25-year-old PHP monolith supporting over 900 distinct site instances across 300 languages and 11 unique projects. It's an immense engineering challenge to modernize infrastructure while serving 250,000 active volunteer editors who build custom workflows via Toolforge—Wikimedia's internal, open-source mini-AWS.

Finally, we have to tackle the philosophical divide between artificial statistical models and human creativity. Because LLMs are trained to predict the statistical mean, they inherently miss the edge cases where real human value, internationalization, and accessibility actually reside. And even if they did, we managed to squeeze out every last bit of AI creativity that early models had until what we are actually left with is the most boring result. We also commiserate over the gratuitous low-quality AI pull requests flooding open-source repositories, drawing parallels to the chaotic Hacktoberfest spam of years past.


## 💡 Notable Links:
* [Frodo project](https://upload.wikimedia.org/wikipedia/commons/3/34/Wikimedia_Hackathon_2026_-_Unified_Developer_Front-Door_Session_Presentation.pdf) - [Source](https://github.com/mooeypoo/poc-wikimedia-frontdoor)
* [Book: The Platform Revolution](https://amzn.to/4q5c3vl)
* [Moriel's LLM experiments](https://github.com/mooeypoo/experiment-genai-localization-copilot)
* [✨ Episode: ](https://adventuresindevops.com/episodes/261-creative-practical-unconventional-engineering/)

## 🎯 Picks:
* Warren - [Video: Are all flags Drawable in PowerPoint](https://www.youtube.com/watch?v=w5QSVhgrqVE)
* Moriel - [Audiobook: Dungeon Crawler Carl](https://amzn.to/42lsbQa)