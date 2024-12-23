package main

import (
	"encoding/json"
	"log"
)

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	// Registered clients for each quiz
	quizRooms map[string]map[*Client]bool

	// Inbound messages from the clients
	broadcast chan *Message

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client
}

type Message struct {
	QuizID  string      `json:"quiz_id"`
	Type    string      `json:"type"` // "join", "answer", "question", "result"
	Content interface{} `json:"content"`
	UserID  string      `json:"user_id"`
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan *Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		quizRooms:  make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// Create room if it doesn't exist
			if _, ok := h.quizRooms[client.quizID]; !ok {
				h.quizRooms[client.quizID] = make(map[*Client]bool)
			}
			h.quizRooms[client.quizID][client] = true

			// Notify all clients in the room about the new participant
			joinMessage := &Message{
				QuizID: client.quizID,
				Type:   "join",
				Content: map[string]interface{}{
					"user_id": client.userID,
					"message": "New participant joined",
				},
			}
			h.broadcastToRoom(client.quizID, joinMessage)

		case client := <-h.unregister:
			if _, ok := h.quizRooms[client.quizID]; ok {
				if _, ok := h.quizRooms[client.quizID][client]; ok {
					delete(h.quizRooms[client.quizID], client)
					close(client.send)

					// If room is empty, delete it
					if len(h.quizRooms[client.quizID]) == 0 {
						delete(h.quizRooms, client.quizID)
					} else {
						// Notify remaining clients about the participant leaving
						leaveMessage := &Message{
							QuizID: client.quizID,
							Type:   "leave",
							Content: map[string]interface{}{
								"user_id": client.userID,
								"message": "Participant left",
							},
						}
						h.broadcastToRoom(client.quizID, leaveMessage)
					}
				}
			}

		case message := <-h.broadcast:
			h.handleMessage(message)
		}
	}
}

func (h *Hub) handleMessage(message *Message) {
	switch message.Type {
	case "answer":
		// Handle answer submission
		h.broadcastToRoom(message.QuizID, message)
	case "question":
		// Broadcast new question to all participants
		h.broadcastToRoom(message.QuizID, message)
	case "result":
		// Broadcast quiz results
		h.broadcastToRoom(message.QuizID, message)
	}
}

func (h *Hub) broadcastToRoom(quizID string, message *Message) {
	if clients, ok := h.quizRooms[quizID]; ok {
		for client := range clients {
			messageJSON, err := json.Marshal(message)
			if err != nil {
				log.Printf("Error marshaling message: %v", err)
				continue
			}

			select {
			case client.send <- messageJSON:
			default:
				close(client.send)
				delete(h.quizRooms[quizID], client)
			}
		}
	}
}
