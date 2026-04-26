# ToDos & Bugs

## Bugs

- [x] Answers are not validated against the current letter — players can submit anything
  - [x] Answers need to be validated in the score phase too (0 points if the first letter doesn't match current letter)
- [x] Closing the phone screen disconnects from the server (no reconnect on wake)
- [x] After voting through all categories, the admin sees no button to proceed to the next round. But the other players see the scoreboard as expected..
- [x] When leaving the game (return to homescreen) before the voting starts, the player is sent back to the game (voting screen) once the timer for the inputs is done
- [ ] Roundtime is set to 120 but the timer begins at 115 once the round starts
- [ ] When joining a lobby and leaving before the game starts, the player still stays in the server/lobby for quite a while (~1 minute?). But when joining before the ~ 1 minute mark is up, a new player is created

---

## ToDos

### Gameplay
- [x] Show all answers across all categories in the final score display (added a tab with Points and Answers so players can switch as they wish :D)
- [X] Keep answers visible on the scoreboard so players can review them before the admin starts the next round
- [x] Highlight duplicate answers during voting so players can spot them easily
- [ ] Show how many players have already submitted during an active round (e.g. "2 / 4 done")
- [x] Notify all players when someone hits "Done" early (currently only the timer changes)
- [x] Animation when the letter is being chosen.. don't just let it pop up
- [x] While skipping through the answers, display a information how much points each player will get
  - 5 for duplicates, 10 for unique (maybe later 20 for upvoted by every other player)
- [x] Ability to just close the current game and start a new one (return to homepage at any time)

### UX
- [x] Generate a real QR code that encodes the join URL (`/join/<roomCode>`)
- [ ] Add a small animation when a player joins the lobby
- [ ] Show which letters have already been used in previous rounds

### Admin
- [ ] Let the admin kick players from the lobby
- [ ] Let the admin change settings between rounds without restarting the whole game
- [x] Ability to skip a letter (e.g. Y or Z ..)

### Technical
- [x] Reconnect handling — rejoin the active game automatically after phone wakes up or briefly loses connection

### Deployment
- [ ] Create a Dockerfile etc. and GitHub Action, so I can let the game run on my Homeserver :D

### Tests 
- [ ] Add tests

---

## Clean Code

- [ ] Rename `cats` and `cat` to categories to and category