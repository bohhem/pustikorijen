#!/bin/bash

# Get your access token - replace this with your actual token from localStorage
# You can get it by opening browser console and typing: localStorage.getItem('accessToken')
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNGNhNWIwMC1jNDBjLTRlNzgtYTg5YS01MmMwYzVmYzg2ZTgiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjA3MzQwMzMsImV4cCI6MTc2MTMzODgzM30.zmAZjvHT7M_yaQ2nk-NqFNU6PDUfNi_feDxHJm72Ohc"

# Branch ID - use one of your branches
BRANCH_ID="FB-TE-TURALIC-001"

echo "Adding grandparents..."

# Add grandfather
GRANDFATHER=$(curl -s -X POST http://localhost:5000/api/v1/branches/$BRANCH_ID/persons \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Mehmed",
    "lastName": "Turalić",
    "gender": "male",
    "birthDate": "1940-01-15T00:00:00Z",
    "birthPlace": "Tešanj, Bosnia",
    "isAlive": false,
    "deathDate": "2010-05-20T00:00:00Z",
    "biography": "Patriarch of the family"
  }')

GRANDFATHER_ID=$(echo $GRANDFATHER | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Grandfather ID: $GRANDFATHER_ID"

# Add grandmother
GRANDMOTHER=$(curl -s -X POST http://localhost:5000/api/v1/branches/$BRANCH_ID/persons \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Fatima",
    "lastName": "Turalić",
    "maidenName": "Hasić",
    "gender": "female",
    "birthDate": "1945-03-10T00:00:00Z",
    "birthPlace": "Tešanj, Bosnia",
    "isAlive": true,
    "biography": "Matriarch of the family"
  }')

GRANDMOTHER_ID=$(echo $GRANDMOTHER | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Grandmother ID: $GRANDMOTHER_ID"

echo "Adding parents..."

# Add father
FATHER=$(curl -s -X POST http://localhost:5000/api/v1/branches/$BRANCH_ID/persons \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Ernad\",
    \"lastName\": \"Turalić\",
    \"gender\": \"male\",
    \"birthDate\": \"1970-07-15T00:00:00Z\",
    \"birthPlace\": \"Tešanj, Bosnia\",
    \"isAlive\": true,
    \"fatherId\": \"$GRANDFATHER_ID\",
    \"motherId\": \"$GRANDMOTHER_ID\",
    \"biography\": \"Second generation\"
  }")

FATHER_ID=$(echo $FATHER | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Father ID: $FATHER_ID"

# Add mother
MOTHER=$(curl -s -X POST http://localhost:5000/api/v1/branches/$BRANCH_ID/persons \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Amina",
    "lastName": "Turalić",
    "maidenName": "Kovač",
    "gender": "female",
    "birthDate": "1972-09-20T00:00:00Z",
    "birthPlace": "Zenica, Bosnia",
    "isAlive": true,
    "biography": "Mother"
  }')

MOTHER_ID=$(echo $MOTHER | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Mother ID: $MOTHER_ID"

echo "Adding children..."

# Add children
curl -s -X POST http://localhost:5000/api/v1/branches/$BRANCH_ID/persons \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Amir\",
    \"lastName\": \"Turalić\",
    \"gender\": \"male\",
    \"birthDate\": \"1995-05-12T00:00:00Z\",
    \"birthPlace\": \"Tešanj, Bosnia\",
    \"isAlive\": true,
    \"fatherId\": \"$FATHER_ID\",
    \"motherId\": \"$MOTHER_ID\",
    \"biography\": \"Eldest son\"
  }" | jq '.'

curl -s -X POST http://localhost:5000/api/v1/branches/$BRANCH_ID/persons \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Selma\",
    \"lastName\": \"Turalić\",
    \"gender\": \"female\",
    \"birthDate\": \"1998-08-30T00:00:00Z\",
    \"birthPlace\": \"Tešanj, Bosnia\",
    \"isAlive\": true,
    \"fatherId\": \"$FATHER_ID\",
    \"motherId\": \"$MOTHER_ID\",
    \"biography\": \"Daughter\"
  }" | jq '.'

echo "Done! Check the tree at: http://localhost:3003/branches/$BRANCH_ID/tree"
