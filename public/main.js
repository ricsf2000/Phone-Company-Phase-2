document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('newCustomer').onsubmit = async (e) => {
        e.preventDefault();
        
        const customerDetails = {
            ssn: document.getElementById('ssn').value,
            fname: document.getElementById('fname').value,
            minitial: document.getElementById('minitial').value,
            lname: document.getElementById('lname').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            birthdate: document.getElementById('birthdate').value
        };
    
        try {
            const response = await fetch('/new_customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerDetails)
            });
            const result = await response.json();
        } catch (err) {
            alert('CUSTOMER CREATION ERROR: ' + err.message);
        }
    };

    document.getElementById('newBankAccount').onsubmit = async (e) => {
        e.preventDefault();
        
        const bankAccountDetails = {
            customer_ssn: document.getElementById('customer_ssn').value,
            balance: document.getElementById('balance').value,
            acct_num: document.getElementById('acct_num').value,
            bank_name: document.getElementById('bank_name').value,
            acct_type: document.getElementById('acct_type').value,
            status: document.getElementById('status').value
        };
    
        try {
            const response = await fetch('/new_bank_account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bankAccountDetails)
            });
            const result = await response.json();
        } catch (err) {
            alert('BANK ACCOUNT CREATION ERROR: ' + err.message);
        }
    };
 
    document.getElementById('newCard').onsubmit = async (e) => {
        e.preventDefault();
        
        const cardDetails = {
            customer_ssn: document.getElementById('card_customer_ssn').value,
            bank_acct_num: document.getElementById('bank_acct_num').value,
            card_num: document.getElementById('card_num').value,
            status: document.getElementById('card_status').value,
            card_type: document.getElementById('card_type').value,
            expiry: document.getElementById('expiry').value
        };
    
        try {
            const response = await fetch('/new_card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cardDetails)
            });
            const result = await response.json();
        } catch (err) {
            alert('CARD CREATION ERROR: ' + err.message);
        }
    };
    
    document.getElementById('newPhonePlan').onsubmit = async (e) => {
        e.preventDefault();
        
        const planDetails = {
            customer_ssn: document.getElementById('plan_customer_ssn').value,
            phone_num: document.getElementById('phone_num').value,
            plan_status: document.getElementById('plan_status').value,
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            plan_type: document.getElementById('plan_type').value,
            renewal_type: document.getElementById('renewal_type').value,
            monthly_cost: document.getElementById('plan_type').value == "Basic" ? 15.00 : 30.00
        };
    
        try {
            const response = await fetch('/new_phone_plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planDetails)
            });
            const result = await response.json();
        } catch (err) {
            alert('PHONE PLAN CREATION ERROR: ' + err.message);
        }
    };

    document.getElementById('billPayment').onsubmit = async (e) => {
        e.preventDefault();
        
        const paymentDetails = {
            card_id: document.getElementById('card_id').value,
            phone_plan_id: document.getElementById('phone_plan_id').value,
            amount: parseFloat(document.getElementById('payment_amount').value)
        };
    
        try {
            const response = await fetch('/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentDetails)
            });
            const result = await response.json();
        } catch (err) {
            alert('PAYMENT ERROR: ' + err.message);
        }
    };

    document.getElementById('avgPayment').onsubmit = async (e) => {
        e.preventDefault();
        const ssn = document.getElementById('payment_ssn').value;
        
        try {
            const response = await fetch(`/avg-payment/${ssn}`);
            const data = await response.json();
            
            document.getElementById('avgPaymentResult').innerHTML = `
                <p>Average: $${data.avg_payment_amount}</p>
            `;
        } catch (err) {
            alert('CALCULATION ERROR: ' + err.message);
        }
    };
    
    document.getElementById('callHistory').onsubmit = async (e) => {
        e.preventDefault();
        const phoneNum = document.getElementById('call_phone_number').value;
        const startDate = document.getElementById('call_start_date').value;
        const endDate = document.getElementById('call_end_date').value;
        
        try {
            const response = await fetch('/call-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNum, startDate, endDate })
            });
            const data = await response.json();
            
            let html = '<table border="1"><tr><th>Date</th><th>Type</th><th>Duration</th><th>Status</th></tr>';
            data.forEach(call => {
                html += `<tr>
                    <td>${call.date}</td>
                    <td>${call.type}</td>
                    <td>${call.duration}</td>
                    <td>${call.status}</td>
                </tr>`;
            });
            html += '</table>';
            
            document.getElementById('callHistoryResult').innerHTML = html;
        } catch (err) {
            alert('ERROR FINDING CALL HISTORY: ' + err.message);
        }
    };
    
    document.getElementById('longCalls').onsubmit = async (e) => {
        e.preventDefault();
        const phoneNum = document.getElementById('long_calls_phone').value;
        const numCalls = document.getElementById('num_calls').value;
        
        try {
            const response = await fetch('/longest-calls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNum, numCalls })
            });
            const data = await response.json();
            
            let html = '<table border="1"><tr><th>Date</th><th>Duration</th><th>Type</th></tr>';
            data.forEach(call => {
                html += `<tr>
                    <td>${call.date}</td>
                    <td>${call.duration}</td>
                    <td>${call.type}</td>
                </tr>`;
            });
            html += '</table>';
            
            document.getElementById('longCallsResult').innerHTML = html;
        } catch (err) {
            document.getElementById('longCallsResult').innerHTML = 
                `<p style="color: red">Error: ${err.message}</p>`;
        }
    };
})

