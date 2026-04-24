# How to build a monolith the right way

**Date:** 2026-04-24
**URL:** https://adventuresindevops.com/episodes/270-ci-cd-building-monoliths-the-right-way
**Description:** Ian Duncan shares his experience with a monolithic CI/CD pipelines and gives tips on what tools to use as your monolith grows.

[Transcript](https://links.adventuresindevops.com/storage/episodes/270/transcript.txt)

---

We sit down with Ian Duncan, senior staff engineer on the stability team at Mercury, to discuss the delicate balance of choosing your tech stack and the implications. That means explore the concept of the novelty budget or frequently known as "Choose Boring Technology". It emphasizes why companies should carefully spend their innovation tokens on things that actually move the needle, rather than reinventing the wheel.

Mercury leverages simple technology like Postgres and EC2 instances alongside high-innovation bets like Haskell and Nix to maintain stability. The conversation unpacks the hidden complexities of over-relying on standard tools, sharing a cautionary tale about using a Postgres table as a massive queuing system until it consumed all the database resources and caused login failures. To solve architectural scaling without descending into nanoservice madness, we jump to discussing monolithic build systems. By leveraging hermetically sealed, modular build targets, teams can achieve massive parallelism and avoid endless local rebuilds while maintaining a single coherent view of the codebase.

We also advocate for separating management tools from primary systems by utilizing dedicated control planes, and touch on the rising popularity of durable execution frameworks like Temporal to handle resilient workflows. And it turns out Ian might be a bigger advocate of microservices that he thought!

## 💡 Notable Links:
* [Ian's blog](https://www.iankduncan.com/)
* [Book: Blah Blah Blah](https://amzn.to/3ODrEFy)
* [Using Innovation Tokens](https://mcfunley.com/choose-boring-technology)
* [Novelty budget](https://shimweasel.com/2018/08/25/novelty-budgets)
* [Buck2](https://buck2.build/)

## 🎯 Picks:
* Warren - [Why Archers Didn’t Volley Fire](https://acoup.blog/2025/05/02/collections-why-archers-didnt-volley-fire/)
* Ian - [Band - Gloryhammer](https://www.gloryhammer.com/)
