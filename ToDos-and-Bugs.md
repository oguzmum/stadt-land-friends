# ToDos & Bugs

## Bugs

- [ ] Answers are not validated against the current letter — players can submit anything
- [ ] Closing the phone screen disconnects from the server (no reconnect on wake)
- [ ] After voting through all categories, the admin sees no button to proceed to the next round. But the other players see the scoreboard as expected..

---

## ToDos

### Gameplay
- [ ] Show all answers across all categories at once after a round instead of going through them one by one??
- [ ] Keep answers visible on the scoreboard so players can review them before the admin starts the next round
- [ ] Highlight duplicate answers during voting so players can spot them easily
- [ ] Show how many players have already submitted during an active round (e.g. "2 / 4 done")
- [ ] Notify all players when someone hits "Done" early (currently only the timer changes)

### UX
- [ ] Generate a real QR code that encodes the join URL (`/join/<roomCode>`)
- [ ] Add a small animation when a player joins the lobby
- [ ] Show which letters have already been used in previous rounds

### Admin
- [ ] Let the admin kick players from the lobby
- [ ] Let the admin change settings between rounds without restarting the whole game

### Technical
- [ ] Reconnect handling — rejoin the active game automatically after phone wakes up or briefly loses connection
- [ ] Prevent the screen from going to sleep during an active round (Wake Lock API)

### Deployment
- [ ] Create a Dockerfile etc. and GitHub Action, so I can let the game run on my Homeserver :D

### Tests 
- [ ] Add tests