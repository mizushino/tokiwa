/// <reference types="node" />

import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = process.env.GCLOUD_PROJECT ?? 'tokiwa-template';
const rules = readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');
const membershipPath = 'projects/project-1/users/member-1';
type RulesTestFirestore = ReturnType<ReturnType<RulesTestEnvironment['authenticatedContext']>['firestore']>;

const readerMembership = {
  displayName: 'Member',
  email: 'member@example.com',
  role: 'reader',
};

describe('firestore rules', () => {
  let testEnvironment: RulesTestEnvironment;

  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      projectId,
      firestore: { rules },
    });
  });

  afterEach(async () => {
    await testEnvironment.clearFirestore();
  });

  beforeEach(async () => {
    await seedUser('member-1', []);
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  function projectFirestore(uid: string, roleClaim: string): RulesTestFirestore {
    return testEnvironment
      .authenticatedContext(uid, {
        p: { projects: [roleClaim] },
      })
      .firestore();
  }

  async function seedMembership(data: Record<string, unknown>, path = membershipPath): Promise<void> {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(path).set(data);
    });
  }

  async function seedProject(): Promise<void> {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('projects/project-1').set({
        name: 'Project',
        code: 'project-code',
      });
    });
  }

  async function seedUser(uid: string, projects: string[]): Promise<void> {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(`users/${uid}`).set({
        displayName: 'Member',
        email: 'member@example.com',
        permissions: { projects },
      });
    });
  }

  it('rejects user document creation from unauthenticated and authenticated clients', async () => {
    const userData = {
      displayName: 'New User',
      email: 'new-user@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const unauthenticatedFirestore = testEnvironment.unauthenticatedContext().firestore();
    const authenticatedFirestore = testEnvironment.authenticatedContext('new-user').firestore();

    await assertFails(unauthenticatedFirestore.doc('users/new-user').set(userData));
    await assertFails(authenticatedFirestore.doc('users/new-user').set(userData));
  });

  it('allows profile updates but rejects changing the Auth-owned email', async () => {
    const firestore = testEnvironment.authenticatedContext('member-1').firestore();

    await assertSucceeds(
      firestore.doc('users/member-1').update({ displayName: 'Updated Member', updatedAt: new Date() })
    );
    await assertFails(firestore.doc('users/member-1').update({ email: 'spoofed@example.com', updatedAt: new Date() }));
  });

  it('allows a constrained public sample create', async () => {
    const firestore = testEnvironment.unauthenticatedContext().firestore();

    await assertSucceeds(
      firestore.doc('samples/sample').set({
        name: 'Sample',
        count: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  });

  it('rejects oversized public sample data and an arbitrary initial count', async () => {
    const firestore = testEnvironment.unauthenticatedContext().firestore();
    const baseData = {
      name: 'Sample',
      count: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await assertFails(firestore.doc('samples/sample').set({ ...baseData, name: 'x'.repeat(101) }));
    await assertFails(firestore.doc('samples/sample').set({ ...baseData, count: 1 }));
    await assertFails(firestore.doc(`samples/${'x'.repeat(65)}`).set(baseData));
  });

  it('rejects public writes outside the fixed demo document', async () => {
    const firestore = testEnvironment.unauthenticatedContext().firestore();

    await assertFails(
      firestore.doc('samples/another-sample').set({
        name: 'Sample',
        count: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  });

  it('allows public sample name updates but rejects counter updates', async () => {
    const firestore = testEnvironment.unauthenticatedContext().firestore();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('samples/sample').set({
        name: 'Before',
        count: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    await assertSucceeds(firestore.doc('samples/sample').update({ name: 'After', updatedAt: new Date() }));
    await assertFails(firestore.doc('samples/sample').update({ count: 4, updatedAt: new Date() }));
  });

  it('allows a reader to read their project but rejects unrelated and unauthenticated users', async () => {
    await seedProject();
    const readerFirestore = projectFirestore('reader-1', 'project-1:r');
    const unrelatedFirestore = projectFirestore('reader-2', 'project-2:r');
    const unauthenticatedFirestore = testEnvironment.unauthenticatedContext().firestore();

    await assertSucceeds(readerFirestore.doc('projects/project-1').get());
    await assertFails(unrelatedFirestore.doc('projects/project-1').get());
    await assertFails(unauthenticatedFirestore.doc('projects/project-1').get());
  });

  it('allows valid project updates and rejects invalid fields, types, and lengths', async () => {
    await seedProject();
    const managerFirestore = projectFirestore('manager-1', 'project-1:m');

    await assertSucceeds(managerFirestore.doc('projects/project-1').update({ name: 'Updated Project' }));
    await assertFails(managerFirestore.doc('projects/project-1').update({ admin: true }));
    await assertFails(managerFirestore.doc('projects/project-1').update({ code: 123 }));
    await assertFails(managerFirestore.doc('projects/project-1').update({ name: 'x'.repeat(101) }));
    await assertFails(managerFirestore.doc('projects/project-1').update({ code: 'x'.repeat(65) }));
  });

  it('allows a manager to create a non-owner membership', async () => {
    const managerFirestore = projectFirestore('manager-1', 'project-1:m');

    await assertSucceeds(managerFirestore.doc(membershipPath).set(readerMembership));
  });

  it('prevents a manager from creating an owner membership', async () => {
    const managerFirestore = projectFirestore('manager-1', 'project-1:m');

    await assertFails(managerFirestore.doc(membershipPath).set({ ...readerMembership, role: 'owner' }));
  });

  it('prevents a manager from promoting a membership to owner', async () => {
    await seedMembership(readerMembership);
    const managerFirestore = projectFirestore('manager-1', 'project-1:m');

    await assertFails(managerFirestore.doc(membershipPath).update({ role: 'owner' }));
  });

  it('prevents a manager from changing or deleting an owner membership', async () => {
    await seedMembership({ ...readerMembership, role: 'owner' });
    const managerFirestore = projectFirestore('manager-1', 'project-1:m');

    await assertFails(managerFirestore.doc(membershipPath).update({ role: 'reader' }));
    await assertFails(managerFirestore.doc(membershipPath).delete());
  });

  it('prevents a manager from granting, changing, or deleting their own membership', async () => {
    const ownMembershipPath = 'projects/project-1/users/manager-1';
    const managerFirestore = projectFirestore('manager-1', 'project-1:m');
    await seedUser('manager-1', []);

    await assertFails(managerFirestore.doc(ownMembershipPath).set({ ...readerMembership, role: 'manager' }));

    await seedMembership({ ...readerMembership, role: 'manager' }, ownMembershipPath);
    await assertFails(managerFirestore.doc(ownMembershipPath).update({ role: 'reader' }));
    await assertFails(managerFirestore.doc(ownMembershipPath).delete());
    await assertSucceeds(managerFirestore.doc(ownMembershipPath).update({ displayName: 'Updated Manager' }));
  });

  it('prevents an owner from changing or deleting their own role', async () => {
    const ownMembershipPath = 'projects/project-1/users/owner-1';
    await seedMembership({ ...readerMembership, role: 'owner' }, ownMembershipPath);
    const ownerFirestore = projectFirestore('owner-1', 'project-1:o');

    await assertFails(ownerFirestore.doc(ownMembershipPath).update({ role: 'manager' }));
    await assertFails(ownerFirestore.doc(ownMembershipPath).delete());
  });

  it('allows an owner to manage owner memberships', async () => {
    const ownerFirestore = projectFirestore('owner-1', 'project-1:o');

    await assertSucceeds(ownerFirestore.doc(membershipPath).set({ ...readerMembership, role: 'owner' }));
    await assertSucceeds(ownerFirestore.doc(membershipPath).update({ role: 'manager' }));
    await assertSucceeds(ownerFirestore.doc(membershipPath).delete());
  });

  it('rejects unknown roles and unexpected fields', async () => {
    const ownerFirestore = projectFirestore('owner-1', 'project-1:o');

    await assertFails(ownerFirestore.doc(membershipPath).set({ ...readerMembership, role: 'guest' }));
    await assertFails(ownerFirestore.doc(membershipPath).set({ ...readerMembership, admin: true }));
  });

  it('allows creating the 30th project membership', async () => {
    await seedUser(
      'member-1',
      Array.from({ length: 29 }, (_, index) => `existing-${index}:r`)
    );
    const managerFirestore = projectFirestore('manager-1', 'project-1:m');

    await assertSucceeds(managerFirestore.doc(membershipPath).set(readerMembership));
  });

  it('rejects creating the 31st project membership', async () => {
    await seedUser(
      'member-1',
      Array.from({ length: 30 }, (_, index) => `existing-${index}:r`)
    );
    const managerFirestore = projectFirestore('manager-1', 'project-1:m');

    await assertFails(managerFirestore.doc(membershipPath).set(readerMembership));
  });

  it('does not treat a legacy raw project claim as a project role', async () => {
    await seedMembership(readerMembership);
    const legacyFirestore = projectFirestore('legacy-1', 'project-1');

    await assertFails(legacyFirestore.doc(membershipPath).get());
    await assertFails(legacyFirestore.doc(membershipPath).set({ ...readerMembership, role: 'owner' }));
  });
});
