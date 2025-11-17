---
custom_slug: auth-showdown-single-versus-multitenant-architecture
hide_table_of_contents: true
title: "The Auth Showdown: Single tenant versus Multitenant Architectures"
description: "The Auth experts square off hoping to get to the bottom of which architecture is truly best with guest Brian Pontarelli."
image: ./post.png
date: 2025-07-17
custom_youtube_embed_url: https://youtu.be/XI8qYgc3fts
---

import GuestCallout from '@site/src/components/guestCallout';
import GuestImage from './guest.jpeg';
import BrandImage from './brand.jpeg';

<GuestCallout name="Brian Pontarelli" link="https://www.linkedin.com/in/voidmain" image={GuestImage} brandImg={BrandImage} />

Get ready for a lively debate on this episode of Adventures in DevOps. We're joined by Brian Pontarelli, founder of FusionAuth and CleanSpeak. Warren and Brian face off by diving into the controversial topic of multitenant versus single-tenant architecture. Expert co-host Aimee Knight joins to moderate the discussion. Ever wondered how someone becomes an "auth expert"? Warren spills the beans on his journey, explaining it's less about a direct path and more about figuring out what it means for yourself. Brian chimes in with his own "random chance" story, revealing how they fell into it after their forum-based product didn't pan out.

Aimee confesses her "alarm bells" start ringing whenever multitenant architecture is mentioned, jokingly demanding "details" and admitting her preference for more separation when it comes to reliability. Brian makes a compelling case for his company's chosen path, explaining how their high-performance, downloadable single-tenant profanity filter, CleanSpeak, handles billions of chat messages a month with extreme low latency. This architectural choice became a competitive advantage, attracting companies that couldn't use cloud-based multitenant competitors due to their need to run solutions in their own data centers.

We critique cloud providers' tendency to push users towards their most profitable services, citing AWS Cognito as an example of a cost-effective solution for small-scale use that becomes cost-prohibitive with scaling and feature enablement. The challenges of integrating with Cognito, including its reliance on numerous other AWS services and the need for custom Lambda functions for configuration, are also a point of contention. The conversation extends to the frustrations of managing upgrades and breaking changes in both multitenant and single-tenant systems and the inherent difficulties of ensuring compatibility across different software versions and integrations. The episode concludes with a humorous take on the current state and perceived limitations of AI in software development, particularly concerning security.

## 🎯 Picks:
- Warren - [Scarpa Hiking shoes - Planet Mojito Suade](https://world.scarpa.com/product/26407274/mojito-lifestyle-sneakers-for-leisure-sports-travel-thyme-green)
- Aimee - [Peloton Tread](https://www.onepeloton.com/tread)
- Brian - [Searchcraft](https://www.searchcraft.io/) and [Fight or Flight](https://www.imdb.com/title/tt13652286/) 
