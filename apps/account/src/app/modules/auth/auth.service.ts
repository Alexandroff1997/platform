import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hashSync } from 'bcryptjs';
import { UserService } from '../user/user.service';

const DUMMY_HASH = hashSync('timing-equalizer', 10);

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<{ valid: true }> {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('Invalid credentials');
    }

    const user = await this.userService.findByEmail(email);
    const passwordHash = user === null ? DUMMY_HASH : user.passwordHash;
    const matches = await compare(password, passwordHash);
    if (user === null || !matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { valid: true };
  }
}
