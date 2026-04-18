# Project Yellow Brick Road: Creative, Practical, and Unconventional Engineering

**Date:** 2026-01-16
**URL:** https://adventuresindevops.com/episodes/261-creative-practical-unconventional-engineering
**Description:** Paul Conroy joins to tell us all about trolling scrapers and Running Elections with unconventional engineering solutions using Google Sheets and Cloudflare.

[Transcript](https://links.adventuresindevops.com/storage/episodes/261/transcript.txt)

---

Paul Conroy, CTO at [Square1](https://www.square1.io/), joins the show to prove that the best defense against malicious bots isn't always a firewall—sometimes, it’s creative data poisoning. Paul recounts a legendary story from the Irish property market where a well-funded competitor attempted to solve their "chicken and egg" problem by scraping his company's listings. Instead of waiting years for lawyers, Paul’s team fed the scrapers "Project Yellow Brick Road": fake listings that placed the British Prime Minister at 10 Downing Street in Dublin and the White House in County Cork. The result? The competitor’s site went viral for all the wrong reasons, forcing them to burn resources manually filtering junk until they eventually gave up and targeted someone else.

We also dive into the high-stakes world of election coverage, where Paul had three weeks to build a "coalition builder" tool for a national election. The solution wasn't a complex microservice architecture, but a humble Google Sheet wrapped in a Cloudflare Worker. Paul explains how they mitigated Google's rate limits and cold start times by putting a heavy cache in front of the sheet, leading to a crucial lesson in pragmatism: data that is "one minute stale" is perfectly acceptable if it saves the engineering team from building a complex invalidation strategy. Practically wins.

Finally, the conversation turns to the one thing that causes more sleepless nights than malicious scrapers: caching layers. Paul and the host commiserate over the "turtles all the way down" nature of modern caching, where a single misconfiguration can lead to a news site accidentally attaching a marathon runner’s photo to a crime story. They wrap up with picks, including a history of cryptography that features the Pope breaking Spanish codes and a defense of North Face hiking boots that might just be "glamping" gear in disguise.

## 🎯 Picks:
* Warren - [The North Face Hedgehog Gore-tex Hiking Shoes](https://amzn.to/3LWwFr7)
* Paul - [The Code Book](https://amzn.to/3NqBQjz)
