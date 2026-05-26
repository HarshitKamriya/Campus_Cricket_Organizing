#!/bin/bash
# Demo Script for Campus Cricket — NIT Srinagar

API_URL="http://localhost:5000/api"

echo "🏏 Starting Campus Cricket Demo..."

# 1. Login
echo -e "\n1. Logging in as admin..."
LOGIN_RES=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "🔑 Token received: ${TOKEN:0:20}..."

# 2. Get Teams
echo -e "\n2. Fetching teams..."
TEAMS_RES=$(curl -s $API_URL/teams)
TEAM_A_ID=$(echo $TEAMS_RES | grep -o '"id":[0-9]*' | head -n 1 | cut -d ':' -f 2)
TEAM_B_ID=$(echo $TEAMS_RES | grep -o '"id":[0-9]*' | head -n 2 | tail -n 1 | cut -d ':' -f 2)
echo "✅ Found Teams: $TEAM_A_ID and $TEAM_B_ID"

# 3. Create Match
echo -e "\n3. Creating match..."
MATCH_RES=$(curl -s -X POST $API_URL/matches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"NIT SXR CS vs ECE Final\",\"venue\":\"NIT Srinagar\",\"total_overs\":20,\"team_a_id\":$TEAM_A_ID,\"team_b_id\":$TEAM_B_ID,\"toss_winner_id\":$TEAM_A_ID,\"toss_decision\":\"bat\"}")

MATCH_ID=$(echo $MATCH_RES | grep -o '"id":[0-9]*' | head -n 1 | cut -d ':' -f 2)
echo "🏟️ Created Match ID: $MATCH_ID"

# 4. Start Match
echo -e "\n4. Starting Match..."
curl -s -X POST $API_URL/matches/$MATCH_ID/start \
  -H "Authorization: Bearer $TOKEN" > /dev/null
echo "▶️ Match started"

# 5. Add Events
echo -e "\n5. Simulating First Over..."
# Get a batsman and bowler ID (hardcoded 1 and 12 for demo assuming seeds)
BATTER_ID=1
BOWLER_ID=12

# Ball 1.1 - 4 runs
curl -s -X POST $API_URL/matches/$MATCH_ID/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"runs_scored\":4,\"is_boundary_four\":true,\"batsman_id\":$BATTER_ID,\"bowler_id\":$BOWLER_ID}" > /dev/null
echo "🏏 Ball 1.1: 4 runs"

# Ball 1.2 - 0 runs (Wicket)
curl -s -X POST $API_URL/matches/$MATCH_ID/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"is_wicket\":true,\"wicket_type\":\"bowled\",\"dismissed_player_id\":$BATTER_ID,\"batsman_id\":$BATTER_ID,\"bowler_id\":$BOWLER_ID}" > /dev/null
echo "❌ Ball 1.2: Wicket! (Bowled)"

# 6. Show Scoreboard
echo -e "\n6. Current Scoreboard:"
curl -s $API_URL/matches/$MATCH_ID/scoreboard | grep -o '"totalRuns":[0-9]*,"totalWickets":[0-9]*,"totalOvers":[0-9]*,"totalBalls":[0-9]*'

echo -e "\n✅ Demo completed successfully!"
