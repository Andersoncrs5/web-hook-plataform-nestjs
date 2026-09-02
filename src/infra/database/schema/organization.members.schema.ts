import { pgTable, uuid, index, uniqueIndex, foreignKey, pgEnum } from 'drizzle-orm/pg-core';

import {
  idPattern,
  createdAtPattern,
  updatedAtPattern,
  deletedAtPattern,
  versionPattern,
} from '../schema-helpers';

import { users } from './user.schema';
import { organizations } from './organization.schema';
import { roles } from './roles.schema';
import { OrganizationMemberStatusEnum } from 'src/common/enums/organizationMember/org.member';

export const organizationMemberStatus = pgEnum('organization_member_status', [
  OrganizationMemberStatusEnum.ACTIVE,
  OrganizationMemberStatusEnum.INVITED,
  OrganizationMemberStatusEnum.SUSPENDED,
]);

export const organizationMembers = pgTable(
  'organization_members',
  {
    ...idPattern,

    organizationId: uuid('organization_id').notNull(),

    userId: uuid('user_id').notNull(),

    roleId: uuid('role_id').notNull(),

    status: organizationMemberStatus('status')
      .default(OrganizationMemberStatusEnum.ACTIVE)
      .notNull(),

    ...versionPattern,
    ...createdAtPattern,
    ...updatedAtPattern,
    ...deletedAtPattern,
  },
  (table) => [
    foreignKey({
      name: 'fk_organization_members_organization',
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
    }).onDelete('cascade'),

    foreignKey({
      name: 'fk_organization_members_user',
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete('cascade'),

    foreignKey({
      name: 'fk_organization_members_role',
      columns: [table.roleId],
      foreignColumns: [roles.id],
    }).onDelete('restrict'),

    uniqueIndex('uk_organization_members_org_user').on(table.organizationId, table.userId),

    index('idx_organization_members_org_id').on(table.organizationId),

    index('idx_organization_members_user_id').on(table.userId),

    index('idx_organization_members_status').on(table.status),
  ],
);
