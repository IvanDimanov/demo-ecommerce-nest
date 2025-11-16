import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('status')
@ApiTags('Status')
export class StatusController {
  @Get('ping')
  @ApiOperation({ summary: 'Ping the server' })
  @ApiResponse({ status: 200, description: 'Server is running' })
  ping(): string {
    return 'pong';
  }
}
