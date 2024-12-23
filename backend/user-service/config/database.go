package config

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	client *mongo.Client
	err    error
)

func ConnectDB() *mongo.Client {
	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		log.Fatal("You must set your 'MONGODB_URI' environmental variable")
	}

	log.Printf("Connecting to MongoDB with URI: %s", uri)
	
	// Configure client options
	clientOptions := options.Client().ApplyURI(uri)
	clientOptions.SetDirect(true) // Connect directly to the server
	clientOptions.SetAuth(options.Credential{
		AuthSource: "admin", // Set auth database to admin
		Username:   "admin",
		Password:   "password123",
	})

	client, err = mongo.NewClient(clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	dbName := os.Getenv("DB_NAME")
	log.Printf("Successfully connected to MongoDB database: %s", dbName)
	
	// List all databases to verify connection
	databases, err := client.ListDatabaseNames(ctx, nil)
	if err != nil {
		log.Printf("Error listing databases: %v", err)
	} else {
		log.Printf("Available databases: %v", databases)
	}

	return client
}

func GetCollection(client *mongo.Client, collectionName string) *mongo.Collection {
	dbName := os.Getenv("DB_NAME")
	log.Printf("Getting collection '%s' from database '%s'", collectionName, dbName)
	
	collection := client.Database(dbName).Collection(collectionName)
	
	// List all collections in the database
	ctx := context.Background()
	collections, err := client.Database(dbName).ListCollectionNames(ctx, nil)
	if err != nil {
		log.Printf("Error listing collections: %v", err)
	} else {
		log.Printf("Available collections in %s: %v", dbName, collections)
	}
	
	return collection
}
