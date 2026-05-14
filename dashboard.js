
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));

    const target = document.getElementById(sectionName);
    if (target) target.classList.add('active');

    const activeItem = Array.from(document.querySelectorAll('.sidebar li'))
        .find(li => li.textContent.toLowerCase().includes(sectionName.toLowerCase()));
    if (activeItem) activeItem.classList.add('active');

    if (sectionName === 'profile') loadProfileData();
}

function loadDashboard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user  = users.find(u => u.id === currentUser.id) || currentUser;

    document.getElementById('userName').textContent          = user.name  || 'User';
    document.getElementById('totalBalance').textContent      = `$${(user.balance  || 0).toFixed(2)}`;
    document.getElementById('totalInvested').textContent     = `$${(user.invested || 0).toFixed(2)}`;
    document.getElementById('totalReturns').textContent      = `$${(user.returns  || 0).toFixed(2)}`;
    document.getElementById('availableBalance').textContent  = `$${(user.balance  || 0).toFixed(2)}`;

    const wb = document.getElementById('withdrawBalance');
    if (wb) wb.textContent = (user.balance || 0).toFixed(2);

    loadTransactions(user.transactions || []);
}

function updateDepositAddress() {
    const sel  = document.getElementById('depositCrypto');
    const addr = document.getElementById('depositAddress');
    if (!sel || !addr) return;

    const addresses = {
        BTC:  '1C8HMGVbabjU8qyuvjgy9CApGoAbdWiiNX',
        ETH: '0x6bd79321809c766c207557369d28884540d72a7b',
        USDT: 'TAntUBQVVv18keAQaTBwCK5HPYPH7b2RZv'
    };
    addr.textContent = addresses[sel.value] || '';
}

function copyAddress() {
    const address = document.getElementById('depositAddress').textContent;
    if (!address) { alert('No address to copy!'); return; }
    navigator.clipboard.writeText(address)
        .then(() => showToast('Address copied to clipboard!'))
        .catch(() => alert('Failed to copy. Please copy manually.'));
}

function makeDeposit(event) {
    event.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const crypto  = document.getElementById('depositCrypto').value;
    const amount  = parseFloat(document.getElementById('depositAmount').value);
    const txHash  = document.getElementById('txHash').value.trim() || 'Pending';

    if (isNaN(amount) || amount <= 0) { showToast('Please enter a valid deposit amount.', true); return; }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const idx   = users.findIndex(u => u.id === currentUser.id);
    if (idx === -1) { showToast('User not found. Please log in again.', true); logout(); return; }

    if (!users[idx].transactions) users[idx].transactions = [];

    const tx = {
        id: Date.now(), date: new Date().toLocaleString(),
        type: 'Deposit', crypto, amount, status: 'Pending', details: txHash
    };

    users[idx].transactions.unshift(tx);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(users[idx]));

    document.getElementById('depositAmount').value = '';
    document.getElementById('txHash').value = '';
    loadDashboard();
    showToast('Deposit submitted! Awaiting confirmation...');

    setTimeout(() => {
        const u2  = JSON.parse(localStorage.getItem('users'));
        const i2  = u2.findIndex(u => u.id === currentUser.id);
        if (i2 !== -1) {
            u2[i2].balance = (u2[i2].balance || 0) + amount;
            const txEntry  = u2[i2].transactions.find(t => t.id === tx.id);
            if (txEntry) txEntry.status = 'Completed';
            localStorage.setItem('users', JSON.stringify(u2));
            localStorage.setItem('currentUser', JSON.stringify(u2[i2]));
            loadDashboard();
            showToast('Deposit approved and added to your balance!');
        }
    }, 2000);
}

function makeWithdraw(event) {
    event.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const crypto  = document.getElementById('withdrawCrypto').value;
    const amount  = parseFloat(document.getElementById('withdrawAmount').value);
    const address = document.getElementById('withdrawAddress').value.trim();

    if (isNaN(amount) || amount <= 0) { showToast('Please enter a valid withdrawal amount.', true); return; }
    if (!address) { showToast('Please enter a withdrawal address.', true); return; }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const idx   = users.findIndex(u => u.id === currentUser.id);
    if (idx === -1) { showToast('User not found. Please log in again.', true); logout(); return; }

    if ((users[idx].balance || 0) < amount) { showToast('Insufficient balance!', true); return; }

    users[idx].balance -= amount;
    if (!users[idx].transactions) users[idx].transactions = [];

    users[idx].transactions.unshift({
        id: Date.now(), date: new Date().toLocaleString(),
        type: 'Withdrawal', crypto, amount, status: 'Processing', details: address
    });

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(users[idx]));

    document.getElementById('withdrawAmount').value  = '';
    document.getElementById('withdrawAddress').value = '';
    loadDashboard();
    showToast('Withdrawal request submitted successfully!');
}

function investPlan(plan, minAmount) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const amount = prompt(`Enter investment amount (minimum $${minAmount}):`);
    if (amount === null) return;

    const investAmount = parseFloat(amount);
    if (isNaN(investAmount) || investAmount < minAmount) {
        showToast(`Minimum investment is $${minAmount}`, true); return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const idx   = users.findIndex(u => u.id === currentUser.id);
    if (idx === -1) { showToast('User not found. Please log in again.', true); logout(); return; }

    if ((users[idx].balance || 0) < investAmount) {
        showToast('Insufficient balance! Please deposit funds first.', true); return;
    }

    users[idx].balance  -= investAmount;
    users[idx].invested  = (users[idx].invested || 0) + investAmount;
    if (!users[idx].transactions) users[idx].transactions = [];

    users[idx].transactions.unshift({
        id: Date.now(), date: new Date().toLocaleString(),
        type: 'Investment', crypto: plan.toUpperCase(),
        amount: investAmount, status: 'Active', details: `${plan} Plan`
    });

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(users[idx]));
    loadDashboard();
    showToast(`Successfully invested $${investAmount.toFixed(2)} in ${plan} plan!`);
}

function loadTransactions(transactions) {
    const tbody = document.getElementById('transactionList');
    if (!tbody) return;

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No transactions yet</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td>${tx.date}</td>
            <td>${tx.type}</td>
            <td>$${tx.amount.toFixed(2)}</td>
            <td class="status-${tx.status.toLowerCase()}">${tx.status}</td>
            <td>${tx.details}</td>
        </tr>
    `).join('');
}

function loadProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    document.getElementById('profileDisplayName').textContent  = currentUser.name  || 'User';
    document.getElementById('profileDisplayEmail').textContent = currentUser.email || '';
    document.getElementById('profileMemberSince').textContent  =
        currentUser.memberSince ? `Member since ${currentUser.memberSince}` : '';

    const avatarImg      = document.getElementById('avatarImg');
    const avatarInitials = document.getElementById('avatarInitials');

    if (currentUser.avatar) {
        avatarImg.src                = currentUser.avatar;
        avatarImg.style.display      = 'block';
        avatarInitials.style.display = 'none';
    } else {
        const initials = (currentUser.name || 'U')
            .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        avatarInitials.textContent   = initials;
        avatarInitials.style.display = 'block';
        avatarImg.style.display      = 'none';
    }

    document.getElementById('profileName').value       = currentUser.name       || '';
    document.getElementById('profileEmail').value      = currentUser.email      || '';
    document.getElementById('profilePhone').value      = currentUser.phone      || '';
    document.getElementById('profileCountry').value    = currentUser.country    || '';
    document.getElementById('profileDob').value        = currentUser.dob        || '';
    document.getElementById('profileBtcAddress').value = currentUser.btcAddress || '';
}

function saveProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users       = JSON.parse(localStorage.getItem('users')) || [];
    const idx         = users.findIndex(u => u.id === currentUser.id);

    const name       = document.getElementById('profileName').value.trim();
    const email      = document.getElementById('profileEmail').value.trim();
    const phone      = document.getElementById('profilePhone').value.trim();
    const country    = document.getElementById('profileCountry').value;
    const dob        = document.getElementById('profileDob').value;
    // const btcAddress = document.getElementById('profileBtcAddress').value.trim();

    if (!name)  { showToast('Name cannot be empty.',  true); return; }
    if (!email) { showToast('Email cannot be empty.', true); return; }

    const updated = { ...currentUser, name, email, phone, country, dob };
    if (idx !== -1) users[idx] = { ...users[idx], name, email, phone, country, dob };

    localStorage.setItem('currentUser', JSON.stringify(updated));
    localStorage.setItem('users', JSON.stringify(users));

    document.getElementById('userName').textContent = name;
    loadProfileData();
    showToast('Profile updated successfully!');
}

function changePassword() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users       = JSON.parse(localStorage.getItem('users')) || [];
    const idx         = users.findIndex(u => u.id === currentUser.id);

    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;

    if (!current || !newPass || !confirm) { showToast('Please fill in all password fields.', true); return; }
    if (currentUser.password !== current)  { showToast('Current password is incorrect.',      true); return; }
    if (newPass.length < 6)                { showToast('Password must be at least 6 characters.', true); return; }
    if (newPass !== confirm)               { showToast('New passwords do not match.',          true); return; }

    const updated = { ...currentUser, password: newPass };
    if (idx !== -1) users[idx].password = newPass;

    localStorage.setItem('currentUser', JSON.stringify(updated));
    localStorage.setItem('users', JSON.stringify(users));

    document.getElementById('currentPassword').value   = '';
    document.getElementById('newPassword').value       = '';
    document.getElementById('confirmNewPassword').value = '';

    showToast('Password changed successfully!');
}

function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64      = e.target.result;
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const users       = JSON.parse(localStorage.getItem('users')) || [];
        const idx         = users.findIndex(u => u.id === currentUser.id);

        const updated = { ...currentUser, avatar: base64 };
        if (idx !== -1) users[idx].avatar = base64;

        localStorage.setItem('currentUser', JSON.stringify(updated));
        localStorage.setItem('users', JSON.stringify(users));

        document.getElementById('avatarImg').src             = base64;
        document.getElementById('avatarImg').style.display   = 'block';
        document.getElementById('avatarInitials').style.display = 'none';
        showToast('Profile photo updated!');
    };
    reader.readAsDataURL(file);
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className   = 'toast' + (isError ? ' error' : '');
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

document.addEventListener('DOMContentLoaded', function () {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    loadDashboard();
    updateDepositAddress();

    const depositForm = document.getElementById('depositForm');
    if (depositForm) depositForm.addEventListener('submit', makeDeposit);

    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) withdrawForm.addEventListener('submit', makeWithdraw);

    const depositCrypto = document.getElementById('depositCrypto');
    if (depositCrypto) depositCrypto.addEventListener('change', updateDepositAddress);
});