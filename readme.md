##Open-Source HRC Event Map

### To Get Started
Clone repo, run `python -m SimpleHTTPServer 8888` and go to `http://127.0.0.1:8888/`

![initial map](http://i.imgur.com/YLmUCM5.png)

### Done
The initial goal was to reach feature parity with [HillaryEventsMap](https://github.com/DevProgress/HillaryEventsMap), however ugly it may look.

### To Do

1. Visual design, obv
2. Search box needs some love, I would like it to look/act like [metro extracts](https://mapzen.com/data/metro-extracts-alt/)
3. Map style needs love, I'll get that tricked out
4. List/marker interactions. Clicking on a marker should highlight the event in the list, and vice versa.
5. How to make the events more accessible? They are sorted by date right now, and include the address, but there's no info in the data to a permalink on HRC's site, or anything. Not sure what we can do here.