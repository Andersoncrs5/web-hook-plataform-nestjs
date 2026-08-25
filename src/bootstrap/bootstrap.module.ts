import { Module } from "@nestjs/common";

import { BootstrapService } from "./bootstrap.service";
import { BOOTSTRAP_TASK } from "./contracts/bootstrap-task.interface";

import { RoleBootstrapTask } from "./tasks/role/role-bootstrap.task";
import { MasterBootstrapTask } from "./tasks/master/master-bootstrap.task";

import { RolesModule } from "src/modules/roles/roles.module";
import { UserModule } from "src/modules/user/user.module";
import { UserRoleModule } from "src/modules/user-role/user-role.module";
import { LinkRoleMasterToMasterBootstrapTask } from "./tasks/link-master/link-master-bootstrap.task";

@Module({
    imports: [
        RolesModule,
        UserModule,
        UserRoleModule,
    ],

    providers: [
        RoleBootstrapTask,
        MasterBootstrapTask,
        LinkRoleMasterToMasterBootstrapTask,

        {
            provide: BOOTSTRAP_TASK,
            useFactory: (
                roleBootstrap: RoleBootstrapTask,
                masterBootstrap: MasterBootstrapTask,
                linkRoleMasterBootstrap: LinkRoleMasterToMasterBootstrapTask,
            ) => [
                roleBootstrap,           
                masterBootstrap,         
                linkRoleMasterBootstrap, 
            ],
            inject: [
                RoleBootstrapTask,
                MasterBootstrapTask,
                LinkRoleMasterToMasterBootstrapTask,
            ],
        },

        BootstrapService,
    ],

    exports: [
        BootstrapService,
    ],
})
export class BootstrapModule {}