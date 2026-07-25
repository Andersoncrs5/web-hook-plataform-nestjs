import { BaseDto } from "src/common/base/dto/base-dto.base"
import { BaseFilter } from "src/common/base/filter/filter.base";

export class RoleFilter extends BaseFilter {
    name?: string;
    description?: string;
    isActive?: boolean;
}