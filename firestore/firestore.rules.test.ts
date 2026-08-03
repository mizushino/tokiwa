/// <reference types="node" />

import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const projectId = process.env.GCLOUD_PROJECT ?? 'tokiwa-template';
const rules = readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');
const membershipPath = 'projects/project-1/users/member-1';
type RulesTestFirestore = ReturnType<ReturnType<RulesTestEnvironment['authenticatedContext']>['firestore']>;

const readerMembership = {
  displayName: 'Member',
  email: 'member@example.com',
  role: 'reader',
};

describe('project membership rules', () => {
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

  it('does not treat a legacy raw project claim as a project role', async () => {
    await seedMembership(readerMembership);
    const legacyFirestore = projectFirestore('legacy-1', 'project-1');

    await assertFails(legacyFirestore.doc(membershipPath).get());
    await assertFails(legacyFirestore.doc(membershipPath).set({ ...readerMembership, role: 'owner' }));
  });
});
