# Backend Assignment


Given the availability of AI-assisted tools like Cursor, GitHub Copilot, or ChatGPT, you should be able to complete this task fairly quickly.
The focus is on demonstrating your understanding of backend architecture, data, databases, elasticsearch and api design. 


## Phase 1: Offline Assignment
Build a simple e-commerce rest api using NodeJS, ElasticSearch and MySQL using https://dummyjson.com/products as dummy data

You are required to build a basic e-commerce api with the followings

1. Docker setup for webserver, elasticsearch and mysql. 
It should run out of the box, so basically I can do “docker compose up” and rest service is running. Basically I want to be able to test without installing anything.


2. Script to fetch data and populate in database
Fetch data from https://dummyjson.com/products and insert into database
Please create a proper schema for the data in MySQL


3. Index the data into ElasticSearch
Please create proper ES schema for the data, the indexing be combined with above script 


4. Simple rest api with following endpoints
 - /categories       to list all categories ( from DB or ES ) 
 - /products         to list all products and support for filters ( from DB or ES ) 
 - /products/aggs       (faceting on meaningful fields ) 
 - /products/{id}     get a single product by id


# Submission Instructions

Share a GitHub repository link or a zipped folder containing your code.

Include a short README that explains:
 - How to run the app locally
 - Your thought process and any trade-offs you made
 - Known limitations, if any
