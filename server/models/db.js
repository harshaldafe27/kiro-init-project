/**
 * Firestore collection helpers — replaces Mongoose models.
 * All IDs are Firestore auto-generated document IDs.
 */
const {
    getDB
} = require('../config/firebase');
const {
    FieldValue,
    Timestamp
} = require('firebase-admin/firestore');

// ─── Generic helpers ────────────────────────────────────────────────────────

const col = (name) => getDB().collection(name);

const docToObj = (doc) => {
    if (!doc.exists) return null;
    return {
        _id: doc.id,
        ...doc.data()
    };
};

const snapToArr = (snap) => snap.docs.map(docToObj);

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
        const snap = await col('users').orderBy('createdAt', 'desc').offset(offset).limit(limit).get();
        return snapToArr(snap);
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
            isPublished: false,
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
        let q = col('events').where('isPublished', '==', true).where('isCancelled', '==', false);
        if (category) q = q.where('category', '==', category);
        const snap = await q.orderBy('date', 'asc').get();
        let results = snapToArr(snap);
        if (search) {
            const s = search.toLowerCase();
            results = results.filter((e) =>
                (e.title && e.title.toLowerCase().includes(s)) ||
                (e.description && e.description.toLowerCase().includes(s)) ||
                (e.tags && e.tags.some((t) => t.toLowerCase().includes(s)))
            );
        }
        const total = results.length;
        return {
            events: results.slice(offset, offset + limit),
            total
        };
    },
    async findByAdmin(adminId, {
        limit = 50,
        offset = 0
    } = {}) {
        const snap = await col('events').where('createdBy', '==', adminId).orderBy('createdAt', 'desc').get();
        const all = snapToArr(snap);
        return {
            events: all.slice(offset, offset + limit),
            total: all.length
        };
    },
    async findAll({
        limit = 10,
        offset = 0
    } = {}) {
        const snap = await col('events').orderBy('createdAt', 'desc').get();
        const all = snapToArr(snap);
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
        const snap = await col('registrations')
            .where('student', '==', studentId)
            .where('event', '==', eventId)
            .limit(1).get();
        return snap.empty ? null : docToObj(snap.docs[0]);
    },
    async findByStudent(studentId) {
        const snap = await col('registrations').where('student', '==', studentId).orderBy('createdAt', 'desc').get();
        return snapToArr(snap);
    },
    async findByEvent(eventId) {
        const snap = await col('registrations').where('event', '==', eventId).get();
        return snapToArr(snap);
    },
    async findByEventIds(eventIds) {
        if (!eventIds.length) return [];
        // Firestore 'in' supports max 30 items
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
        const snap = await col('auditLogs').orderBy('createdAt', 'desc').get();
        const all = snapToArr(snap);
        return {
            logs: all.slice(offset, offset + limit),
            total: all.length
        };
    },
};

module.exports = {
    Users,
    Events,
    Registrations,
    AuditLogs,
    col
};