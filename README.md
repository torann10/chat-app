# Chat App

This project is a monorepo containing a frontend, backend, and shared workspace. Follow the instructions below to set up your environment and run the application locally.

## Prerequisites

Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (Ensure you have a recent version)
* npm (comes with Node.js)

## Getting Started

Follow these steps to get the application up and running:

### 1. Set Up Environment Variables

Before installing dependencies or running the app, you need to configure your environment variables. 

Duplicate the `.env.template` file and rename the copy to `.env.local`. Fill in the necessary values for your local setup.

### 2. Install Dependencies and Build

This project uses a custom install script that will install dependencies for all workspaces, build the shared package, and generate the Prisma client for the backend.

Run the following command in the root directory:

`npm run install`

### 3. Start the Application

Once everything is installed and bui
