const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const { error } = require('console');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));  

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'phone_billing_db',
    password: 'phonebilling123',
    port: 5432
})

const createTables = `
-- Existing tables with original naming
CREATE TABLE IF NOT EXISTS CUSTOMER (
    ssn VARCHAR(11) PRIMARY KEY, 
    address VARCHAR(100) NOT NULL,
    birthdate DATE NOT NULL,
    email VARCHAR(100) NOT NULL,
    fname VARCHAR(50) NOT NULL, 
    minitial VARCHAR(1),
    lname VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS BANK_ACCOUNT (
    customer_ssn VARCHAR(11) NOT NULL,
    balance DECIMAL(15,2) NOT NULL,
    acct_num VARCHAR(20) PRIMARY KEY,
    bank_name VARCHAR(20) NOT NULL,
    acct_type VARCHAR(20) NOT NULL, 
    status VARCHAR(10) NOT NULL,
    FOREIGN KEY (customer_ssn) REFERENCES CUSTOMER(ssn)
);

CREATE TABLE IF NOT EXISTS CARD (
    customer_ssn VARCHAR(11) NOT NULL,
    bank_acct_num VARCHAR(20) NOT NULL,
    card_id SERIAL PRIMARY KEY,
    card_num VARCHAR(16) NOT NULL, 
    status VARCHAR(20) NOT NULL,
    card_type VARCHAR(20) NOT NULL,
    expiry DATE NOT NULL,
    FOREIGN KEY (customer_ssn) REFERENCES CUSTOMER(ssn),
    FOREIGN KEY (bank_acct_num) REFERENCES BANK_ACCOUNT(acct_num)
);

CREATE TABLE IF NOT EXISTS PLAN_TYPE (
    plan_type_id SERIAL PRIMARY KEY,
    data_rate DECIMAL(5,2) NOT NULL,
    data_limit INTEGER NOT NULL,
    monthly_cost DECIMAL(15,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS PHONE_PLAN (
    plan_id SERIAL PRIMARY KEY,
    customer_ssn VARCHAR(11) NOT NULL,
    plan_type_id INT NOT NULL,
    phone_num VARCHAR(15) NOT NULL,
    plan_status VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL, 
    renewal_type VARCHAR(20) NOT NULL,
    FOREIGN KEY (customer_ssn) REFERENCES CUSTOMER(ssn),
    FOREIGN KEY (plan_type_id) REFERENCES PLAN_TYPE(plan_type_id)
);

CREATE TABLE IF NOT EXISTS CALLS (
    phone_plan_id INT NOT NULL,
    call_id SERIAL NOT NULL,
    call_status VARCHAR(20) NOT NULL,
    call_type VARCHAR(20) NOT NULL,
    start_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    end_timestamp TIMESTAMP,
    PRIMARY KEY(call_id, phone_plan_id),
    FOREIGN KEY(phone_plan_id) REFERENCES PHONE_PLAN(plan_id)
);

CREATE TABLE IF NOT EXISTS TRANSACTION_HISTORY (
    transaction_id SERIAL PRIMARY KEY,
    card_id INT NOT NULL,
    phone_plan_id INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    trans_date DATE NOT NULL,
    trans_type VARCHAR(20) NOT NULL,
    description VARCHAR(200),
    amount_before DECIMAL(15,2) NOT NULL,
    amount_after DECIMAL(15,2) NOT NULL,
    FOREIGN KEY(card_id) REFERENCES CARD(card_id),
    FOREIGN KEY(phone_plan_id) REFERENCES PHONE_PLAN(plan_id)
);

CREATE TABLE IF NOT EXISTS SUPPORT_TICKETS (
    ticket_id SERIAL PRIMARY KEY,
    phone_plan_id INT NOT NULL,
    create_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    priority INT NOT NULL,
    issue_category VARCHAR(50) NOT NULL,
    FOREIGN KEY (phone_plan_id) REFERENCES PHONE_PLAN(plan_id)
);

CREATE TABLE IF NOT EXISTS DEVICE_INVENTORY (
    device_id SERIAL PRIMARY KEY,
    phone_plan_id INT NOT NULL,
    device_model VARCHAR(50) NOT NULL,
    purchase_date DATE NOT NULL,
    warranty_end DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY (phone_plan_id) REFERENCES PHONE_PLAN(plan_id)
);

CREATE TABLE IF NOT EXISTS SERVICE_LOCATIONS (
    location_id SERIAL PRIMARY KEY,
    phone_plan_id INT NOT NULL,
    address VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY (phone_plan_id) REFERENCES PHONE_PLAN(plan_id)
);

-- Indexes for each table
CREATE INDEX idx_customer_email ON CUSTOMER(email);
CREATE INDEX idx_bank_customer ON BANK_ACCOUNT(customer_ssn);
CREATE INDEX idx_card_bank ON CARD(bank_acct_num);
CREATE INDEX idx_plan_type_cost ON PLAN_TYPE(monthly_cost);
CREATE INDEX idx_plan_customer ON PHONE_PLAN(customer_ssn, plan_status);
CREATE INDEX idx_calls_search ON CALLS(phone_plan_id, call_type, start_timestamp);
CREATE INDEX idx_transactions_date ON TRANSACTION_HISTORY(trans_date);
CREATE INDEX idx_support_status ON SUPPORT_TICKETS(status);
CREATE INDEX idx_device_status ON DEVICE_INVENTORY(status);
CREATE INDEX idx_location_city ON SERVICE_LOCATIONS(city);

CREATE SEQUENCE IF NOT EXISTS call_id_seq;

INSERT INTO CUSTOMER ( ssn, address, birthdate, email, fname, minitial, lname) 
VALUES ('000-00-0000', '123 Company Drive', '1995-12-23', 'R++Phone@gmail.com', 'R++', 'P', 'Company')
ON CONFLICT (ssn) DO NOTHING;

INSERT INTO BANK_ACCOUNT ( customer_ssn, balance, acct_num, bank_name, acct_type, status ) 
VALUES ('000-00-0000', 500000, -1, 'phone bank', 'Checking', 'Active')
ON CONFLICT (acct_num) DO NOTHING;
`;

async function setupDB() {
    try {
        await pool.query(createTables);
        console.log('TABLES CREATED');
    } catch(err) {
        console.error('TABLE CREATION ERROR:', err);
    }
}

setupDB();

const generateCall = async (phone_plan_id) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const startTimestamp = new Date();
        startTimestamp.setDate(startTimestamp.getDate() - Math.floor(Math.random() * 365));
        
        const duration = Math.floor(Math.random() * 60) + 1;
        const endTimestamp = new Date(startTimestamp.getTime() + duration * 60000);

        const callTypeNum = Math.random();
        const callType = callTypeNum < 0.75 ? 'Domestic' : 'International';

        const callStatusNum = Math.random();
        const callStatus = callStatusNum < 0.8 ? 'Completed' : 'Failed';

        await client.query(`
            INSERT INTO CALLS
            (phone_plan_id, call_id, call_status, call_type, start_timestamp, end_timestamp)
            VALUES
            ($1, nextval('call_id_seq'), $2, $3, $4, $5)`,
        [
            phone_plan_id,
            callStatus,
            callType, 
            startTimestamp,
            endTimestamp
        ]);

        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const beginCallGenerator = () => {
    setInterval(async () => {
        try {
            const result = await pool.query(`
                SELECT plan_id
                FROM phone_plan
                WHERE plan_status = 'Active'
            `);

            for(const plan of result.rows) {
                for (let i = 0; i < 5; i++){
                    await generateCall(plan.plan_id);
                }
            }
        } catch (err) {
            console.error('CALL GENERATION ERROR:', err);
        }
    }, 30000);
};

const newCustomer = async (customerInfo) => {
    try {
        const result = await pool.query(`
            INSERT INTO CUSTOMER (
                ssn,
                address,
                birthdate,
                email,
                fname,
                minitial,
                lname
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING ssn`,
        [
            customerInfo.ssn,
            customerInfo.address,
            customerInfo.birthdate,
            customerInfo.email,
            customerInfo.fname,
            customerInfo.minitial,
            customerInfo.lname
        ]);
        return result.rows[0].ssn;
    } catch (err) {
        console.error('CUSTOMER CREATION ERROR:', err);
        throw err;
    }
};

app.post('/new_customers', async (req, res) => {
    try {
        const ssn = await newCustomer(req.body);
        res.json({ success : true, ssn });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


const newBankAccount = async (bankAccountInfo) => {
    try {
        const result = await pool.query(`
            INSERT INTO BANK_ACCOUNT (
                customer_ssn,
                balance,
                acct_num,
                bank_name,
                acct_type,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING acct_num`,
        [
            bankAccountInfo.customer_ssn,
            bankAccountInfo.balance,
            bankAccountInfo.acct_num,
            bankAccountInfo.bank_name,
            bankAccountInfo.acct_type,
            bankAccountInfo.status
        ]);
        return result.rows[0].acct_num;
    } catch (err) {
        console.error('BANK ACCOUNT CREATION ERROR:', err);
        throw err;
    }
};

app.post('/new_bank_account', async (req, res) => {
    try {
        const acct_num = await newBankAccount(req.body);
        res.json({ success: true, acct_num });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


const newCard = async (cardInfo) => {
    try {
        const result = await pool.query(`
            INSERT INTO CARD (
                customer_ssn,
                bank_acct_num,
                card_num,
                status,
                card_type,
                expiry
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING card_id`,
        [
            cardInfo.customer_ssn,
            cardInfo.bank_acct_num,
            cardInfo.card_num,
            cardInfo.status,
            cardInfo.card_type,
            cardInfo.expiry
        ]);
        return result.rows[0].card_id;
    } catch (err) {
        console.error('CARD CREATION ERROR:', err);
        throw err;
    }
};

app.post('/new_card', async (req, res) => {
    try {
        const card_id = await newCard(req.body);
        res.json({ success: true, card_id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


const newPhonePlan = async (planInfo) => {
    try {
        const result = await pool.query(`
            INSERT INTO PHONE_PLAN (
                customer_ssn,
                monthly_cost,
                phone_num,
                plan_status,
                start_date,
                end_date,
                plan_type,
                renewal_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING plan_id`,
        [
            planInfo.customer_ssn,
            planInfo.monthly_cost,
            planInfo.phone_num,
            planInfo.plan_status,
            planInfo.start_date,
            planInfo.end_date,
            planInfo.plan_type,
            planInfo.renewal_type
        ]);
        return result.rows[0].plan_id;
    } catch (err) {
        console.error('PHONE PLAN CREATION ERROR:', err);
        throw err;
    }
};

app.post('/new_phone_plan', async (req, res) => {
    try {
        const plan_id = await newPhonePlan(req.body);
        res.json({ success: true, plan_id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const payBill = async (paymentInfo) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            UPDATE BANK_ACCOUNT 
            SET balance = 
                CASE 
                    WHEN acct_num = '-1' THEN balance + $1
                    ELSE balance - $1
                END
            WHERE acct_num IN (
                SELECT bank.acct_num 
                FROM BANK_ACCOUNT bank
                JOIN CARD c ON bank.acct_num = c.bank_acct_num 
                WHERE c.card_id = $2 
                AND bank.balance >= $1
                UNION 
                SELECT '-1'
            )`,
            [paymentInfo.amount, paymentInfo.card_id]
        );


        const result = await client.query(`
            INSERT INTO TRANSACTION_HISTORY (
                card_id,
                phone_plan_id,
                status,
                trans_date,
                trans_type,
                description,
                amount_before,
                amount_after
            )
            SELECT 
                $1,
                $2,
                'Completed',
                CURRENT_DATE,
                'Payment',
                'R++ phone bill payment',
                bank.balance,
                bank.balance - $3
            FROM BANK_ACCOUNT bank 
            JOIN CARD c ON bank.acct_num = c.bank_acct_num 
            WHERE c.card_id = $1
            RETURNING true as success, amount_after as new_balance`,
            [paymentInfo.card_id, paymentInfo.phone_plan_id, paymentInfo.amount]
        );

        if (!result.rows.length) {
            throw new Error('INSUFFICIENT FUNDS');
        }

        await client.query('COMMIT');
        return {
            success: true,
            newBalance: result.rows[0].new_balance
        };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

app.post('/pay', async (req, res) => {
    try {
        const result = await payBill(req.body);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


app.get('/avg-payment/:ssn', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT 
                ROUND(AVG(t.amount_before - t.amount_after)::numeric, 2) as avg_payment_amount
            FROM TRANSACTION_HISTORY t
            JOIN PHONE_PLAN p ON t.phone_plan_id = p.plan_id
            JOIN CUSTOMER c ON p.customer_ssn = c.ssn
            WHERE t.trans_type = 'Payment' 
            AND t.status = 'Completed'
            AND c.ssn = $1
            GROUP BY c.ssn`,
            [req.params.ssn]
        );
        
        if (result.rows.length === 0) {
            res.json({
                customer_name: 'Not Found',
                avg_payment_amount: 0,
                number_of_payments: 0
            });
        } else {
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error('AVG PAYMENT ERROR:', err);
    } finally {
        client.release();
    }
});

app.post('/call-history', async (req, res) => {
    const client = await pool.connect();
    try {
        const { phoneNumber, startDate, endDate } = req.body;
        
        const result = await client.query(`
            SELECT 
                start_timestamp::date as date,
                call_type as type,
                EXTRACT(EPOCH FROM (end_timestamp - start_timestamp))/60 AS duration,
                call_status AS status
            FROM CALLS c
            JOIN PHONE_PLAN p ON c.phone_plan_id = p.plan_id
            WHERE p.phone_num = $1
            AND start_timestamp::date BETWEEN $2 AND $3
            ORDER BY start_timestamp DESC`,
            [phoneNumber, startDate, endDate]
        );
        
        const formattedCalls = result.rows.map(call => ({
            ...call,
            duration: Math.round(call.duration) + ' minutes'
        }));
        
        res.json(formattedCalls);
    } catch (err) {
        console.error('CALL HISTORY ERROR:', err);
    } finally {
        client.release();
    }
});

app.post('/longest-calls', async (req, res) => {
    const client = await pool.connect();
    try {
        const { phoneNumber, numCalls } = req.body;
        
        const result = await client.query(`
            SELECT 
                start_timestamp::date as date,
                EXTRACT(EPOCH FROM (end_timestamp - start_timestamp))/60 as duration,
                call_type as type
            FROM CALLS c
            JOIN PHONE_PLAN p ON c.phone_plan_id = p.plan_id
            WHERE p.phone_num = $1
            AND end_timestamp IS NOT NULL
            ORDER BY (end_timestamp - start_timestamp) DESC
            LIMIT $2`,
            [phoneNumber, numCalls]
        );
        
        const formattedCalls = result.rows.map(call => ({
            ...call,
            duration: Math.round(call.duration) + ' minutes'
        }));
        
        res.json(formattedCalls);
    } catch (err) {
        console.error('LONGEST CALLS ERROR:', err);
    } finally {
        client.release();
    }
});


app.listen(3000, () => {
    console.log('Server running on port 3000');
    beginCallGenerator();
});
