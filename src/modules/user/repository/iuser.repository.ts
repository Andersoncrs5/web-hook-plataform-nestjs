import { Injectable } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { Page, Pageable } from "src/common/page/page";
import { UserFilter } from "../dto/user-filter.filter";
import { UserSort } from "../dto/user-sort.page";

export abstract class IUserRepository {

    abstract findAll(filter: UserFilter, pageable: Pageable<UserSort>): Promise<Page<User>>;

    abstract deleteById(id: string): Promise<boolean>;

    abstract update(user: User): Promise<User>;

    abstract findById(id: string): Promise<User | null>;

    abstract create(user: User): Promise<User>;

    abstract findByEmail(email: string): Promise<User | null>;

    abstract existsByEmail(email: string): Promise<boolean>

}