const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const RSSParser = require('rss-parser');
const cors = require('cors');
const client = require('prom-client');

const app = express();
const parser = new RSSParser();

app.use(bodyParser.json());
app.use(cors({
    origin: 'http://next-app:3001',
    credentials: true
}));

// Prometheus metrics
const register = client.register;
const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
});

app.use((req, res, next) => {
    res.on('finish', () => {
        requestCounter.inc({
            method: req.method,
            route: req.path,
            status: res.statusCode,
        });
    });
    next();
});

// Default route for root
app.get('/', (req, res) => {
    res.send('Backend is running! Use /rss-updates or /metrics.');
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Connect to PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.DB_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.DB_PORT,
});

// API: Get RSS Updates
app.get('/rss-updates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM updates ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching updates:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch RSS and Save to Database
async function fetchRSS() {
    try {
        const feed = await parser.parseURL('https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml');
        for (const item of feed.items) {
            await pool.query(
                'INSERT INTO updates (title, link) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [item.title, item.link]
            );
        }
        console.log('RSS feed updated successfully.');
    } catch (error) {
        console.error('Error fetching RSS:', error);
    }
}

async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS updates (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                link TEXT NOT NULL UNIQUE
            );
        `);
        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Call this function during app startup
initializeDatabase();


// Fetch RSS every minute
setInterval(fetchRSS, 60000);

app.listen(5001, '0.0.0.0', () => {
    console.log('Backend is running on port 4000');
});
