/**
 * Firestore collection helpers — replaces Mongoose models.
 * Uses in-memory sorting to avoid composite index requirements.
 */
const {
    getDB
} = require('../config/firebase');
const {
    FieldValue
} = require('firebase-admin/firestore');

const col = (name) => getDB().collection(name);

const docToObj = (doc) => {
    if (!doc.exists) return null;
    return {
        _id: doc.id,
        ...doc.data()
    };
};

const snapToArr = (snap) => snap.docs.map(docToObj);

const sortByDate = (arr, field = 'createdAt', dir = 'desc') => [...arr].sort((a, b) => {
    const av = a[field] || '';
    const bv = b[field] || '';
    return dir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
});

// ─── Users ───────────────────────────────────────────────────────────────────

const Users = {
    async create(data) {
        const ref = col('users').doc();
        const now = new Date().toISOString();
        const user = {
            ...data,
            isActive: true,
            createdAt: now,
            updatedAt: now
        };
        await ref.set(user);
        return {
            _id: ref.id,
            ...user
        };
    },
    async findById(id) {
        return docToObj(await col('users').doc(id).get());
    },
    async findByEmail(email) {
        const snap = await col('users').where('email', '==', email).limit(1).get();
        return snap.empty ? null : docToObj(snap.docs[0]);
    },
    async findAll({
        limit = 10,
        offset = 0
    } = {}) {
        const snap = await col('users').get();
        const all = sortByDate(snapToArr(snap));
        return all.slice(offset, offset + limit);
    },
    async count() {
        const snap = await col('users').count().get();
        return snap.data().count;
    },
    async countWhere(field, op, value) {
        const snap = await col('users').where(field, op, value).count().get();
        return snap.data().count;
    },
    async update(id, data) {
        const ref = col('users').doc(id);
        await ref.update({
            ...data,
            updatedAt: new Date().toISOString()
        });
        return docToObj(await ref.get());
    },
};

// ─── Events ──────────────────────────────────────────────────────────────────

const Events = {
    async create(data) {
        const ref = col('events').doc();
        const now = new Date().toISOString();
        const event = {
            registeredCount: 0,
            isPublished: true,
            isCancelled: false,
            fee: 0,
            ...data,
            createdAt: now,
            updatedAt: now
        };
        await ref.set(event);
        return {
            _id: ref.id,
            ...event
        };
    },
    async findById(id) {
        return docToObj(await col('events').doc(id).get());
    },
    async findPublished({
        search,
        category,
        limit = 10,
        offset = 0
    } = {}) {
        // Fetch ALL events, filter entirely in memory — zero Firestore index requirements
        const snap = await col('events').get();
        let results = snapToArr(snap).filter((e) => e.isCancelled !== true);
        if (category) results = results.filter((e) => e.category === category);
        if (search) {
            const s = search.toLowerCase();
            results = results.filter((e) =>
                (e.title && e.title.toLowerCase().includes(s)) ||
                (e.description && e.description.toLowerCase().includes(s)) ||
                (e.tags && e.tags.some((t) => t.toLowerCase().includes(s)))
            );
        }
        results = sortByDate(results, 'date', 'asc');
        return {
            events: results.slice(offset, offset + limit),
            total: results.length
        };
    },
    async findByAdmin(adminId, {
        limit = 50,
        offset = 0
    } = {}) {
        // Filter by createdBy, sort in memory to avoid composite index
        const snap = await col('events').where('createdBy', '==', adminId).get();
        const all = sortByDate(snapToArr(snap));
        return {
            events: all.slice(offset, offset + limit),
            total: all.length
        };
    },
    async findAll({
        limit = 10,
        offset = 0
    } = {}) {
        const snap = await col('events').get();
        const all = sortByDate(snapToArr(snap));
        return {
            events: all.slice(offset, offset + limit),
            total: all.length
        };
    },
    async update(id, data) {
        const ref = col('events').doc(id);
        await ref.update({
            ...data,
            updatedAt: new Date().toISOString()
        });
        return docToObj(await ref.get());
    },
    async delete(id) {
        await col('events').doc(id).delete();
    },
    async incrementCount(id, delta = 1) {
        await col('events').doc(id).update({
            registeredCount: FieldValue.increment(delta)
        });
    },
    async countAll() {
        const snap = await col('events').count().get();
        return snap.data().count;
    },
    async markComplete(id) {
        const ref = col('events').doc(id);
        await ref.update({
            isCompleted: true,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return docToObj(await ref.get());
    },
    async setCertificatesDistributed(id) {
        const ref = col('events').doc(id);
        await ref.update({
            certificatesDistributed: true,
            updatedAt: new Date().toISOString()
        });
        return docToObj(await ref.get());
    },
};

// ─── Registrations ───────────────────────────────────────────────────────────

const Registrations = {
    async create(data) {
        const ref = col('registrations').doc();
        const now = new Date().toISOString();
        const reg = {
            status: 'pending',
            paymentStatus: 'not_required',
            ...data,
            registeredAt: now,
            createdAt: now,
            updatedAt: now
        };
        await ref.set(reg);
        return {
            _id: ref.id,
            ...reg
        };
    },
    async findById(id) {
        return docToObj(await col('registrations').doc(id).get());
    },
    async findDuplicate(studentId, eventId) {
        const snap = await col('registrations').where('student', '==', studentId).where('event', '==', eventId).limit(1).get();
        return snap.empty ? null : docToObj(snap.docs[0]);
    },
    async findByStudent(studentId) {
        const snap = await col('registrations').where('student', '==', studentId).get();
        return sortByDate(snapToArr(snap));
    },
    async findByEvent(eventId) {
        const snap = await col('registrations').where('event', '==', eventId).get();
        return snapToArr(snap);
    },
    async findByEventIds(eventIds) {
        if (!eventIds.length) return [];
        const chunks = [];
        for (let i = 0; i < eventIds.length; i += 30) chunks.push(eventIds.slice(i, i + 30));
        const results = [];
        for (const chunk of chunks) {
            const snap = await col('registrations').where('event', 'in', chunk).get();
            results.push(...snapToArr(snap));
        }
        return results;
    },
    async update(id, data) {
        const ref = col('registrations').doc(id);
        await ref.update({
            ...data,
            updatedAt: new Date().toISOString()
        });
        return docToObj(await ref.get());
    },
    async deleteByEvent(eventId) {
        const snap = await col('registrations').where('event', '==', eventId).get();
        const batch = getDB().batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
    },
    async countAll() {
        const snap = await col('registrations').count().get();
        return snap.data().count;
    },
    async findPaidByEventIds(eventIds) {
        if (!eventIds.length) return [];
        const all = await this.findByEventIds(eventIds);
        return all.filter((r) => r.paymentStatus === 'paid');
    },
    async findConfirmedByEvent(eventId) {
        const snap = await col('registrations')
            .where('event', '==', eventId)
            .where('status', '==', 'confirmed')
            .get();
        return snapToArr(snap);
    },
    async setCertificateAvailable(ids) {
        if (!ids.length) return;
        const batch = getDB().batch();
        ids.forEach((id) => {
            const ref = col('registrations').doc(id);
            batch.update(ref, {
                certificateAvailable: true,
                updatedAt: new Date().toISOString()
            });
        });
        await batch.commit();
    },
};

// ─── AuditLogs ───────────────────────────────────────────────────────────────

const AuditLogs = {
    async create(data) {
        const ref = col('auditLogs').doc();
        const log = {
            ...data,
            createdAt: new Date().toISOString()
        };
        await ref.set(log);
        return {
            _id: ref.id,
            ...log
        };
    },
    async findAll({
        limit = 15,
        offset = 0
    } = {}) {
        const snap = await col('auditLogs').get();
        const all = sortByDate(snapToArr(snap));
        return {
            logs: all.slice(offset, offset + limit),
            total: all.length
        };
    },
};

// ─── Announcements ───────────────────────────────────────────────────────────

const Announcements = {
    async create(data) {
        const ref = col('announcements').doc();
        const announcement = {
            ...data,
            createdAt: new Date().toISOString()
        };
        await ref.set(announcement);
        return {
            _id: ref.id,
            ...announcement
        };
    },
    async findBySender(senderId, {
        limit = 50,
        offset = 0
    } = {}) {
        const snap = await col('announcements').where('senderId', '==', senderId).get();
        const all = sortByDate(snapToArr(snap));
        return {
            announcements: all.slice(offset, offset + limit),
            total: all.length
        };
    },
    async findAll({
        limit = 50,
        offset = 0
    } = {}) {
        const snap = await col('announcements').get();
        const all = sortByDate(snapToArr(snap));
        return {
            announcements: all.slice(offset, offset + limit),
            total: all.length
        };
    },
    async findById(id) {
        return docToObj(await col('announcements').doc(id).get());
    },
    async delete(id) {
        await col('announcements').doc(id).delete();
    },
};

// ─── Notifications ────────────────────────────────────────────────────────────

const Notifications = {
    async create(data) {
        const ref = col('notifications').doc();
        const notification = {
            isRead: false,
            ...data,
            createdAt: new Date().toISOString()
        };
        await ref.set(notification);
        return {
            _id: ref.id,
            ...notification
        };
    },
    async createBatch(dataArray) {
        const batch = getDB().batch();
        const now = new Date().toISOString();
        const docs = dataArray.map((data) => {
            const ref = col('notifications').doc();
            const notification = {
                isRead: false,
                ...data,
                createdAt: now
            };
            batch.set(ref, notification);
            return {
                _id: ref.id,
                ...notification
            };
        });
        await batch.commit();
        return docs;
    },
    async findByRecipient(recipientId, {
        limit = 20,
        offset = 0
    } = {}) {
        const snap = await col('notifications').where('recipientId', '==', recipientId).get();
        const all = sortByDate(snapToArr(snap));
        return {
            notifications: all.slice(offset, offset + limit),
            total: all.length
        };
    },
    async countUnread(recipientId) {
        const snap = await col('notifications')
            .where('recipientId', '==', recipientId)
            .where('isRead', '==', false)
            .count()
            .get();
        return snap.data().count;
    },
    async markRead(id) {
        const ref = col('notifications').doc(id);
        await ref.update({
            isRead: true
        });
        return docToObj(await ref.get());
    },
    async markAllRead(recipientId) {
        const snap = await col('notifications')
            .where('recipientId', '==', recipientId)
            .where('isRead', '==', false)
            .get();
        if (snap.empty) return;
        const batch = getDB().batch();
        snap.docs.forEach((d) => batch.update(d.ref, {
            isRead: true
        }));
        await batch.commit();
    },
    async deleteByAnnouncement(announcementId) {
        const snap = await col('notifications').where('announcementId', '==', announcementId).get();
        if (snap.empty) return;
        const batch = getDB().batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
    },
    async nullifyEventId(eventId) {
        const snap = await col('notifications').where('eventId', '==', eventId).get();
        if (snap.empty) return;
        const batch = getDB().batch();
        snap.docs.forEach((d) => batch.update(d.ref, {
            eventId: null
        }));
        await batch.commit();
    },
};

module.exports = {
    Users,
    Events,
    Registrations,
    AuditLogs,
    Announcements,
    Notifications,
    col
};