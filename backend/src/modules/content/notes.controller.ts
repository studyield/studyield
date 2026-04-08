import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { UpdateNoteDto } from './dto/note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get note by ID' })
  @ApiResponse({ status: 200, description: 'Note found' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notesService.findByIdWithAccess(id, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update note' })
  @ApiResponse({ status: 200, description: 'Note updated' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete note' })
  @ApiResponse({ status: 204, description: 'Note deleted' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.notesService.delete(id, user.sub);
  }

  @Post(':id/pin')
  @ApiOperation({ summary: 'Toggle note pin status' })
  @ApiResponse({ status: 200, description: 'Pin status toggled' })
  async togglePin(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notesService.togglePin(id, user.sub);
  }

  @Get(':id/mind-map')
  @ApiOperation({ summary: 'Generate mind map from note content' })
  @ApiResponse({ status: 200, description: 'Mind map generated' })
  async generateMindMap(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notesService.generateMindMap(id, user.sub);
  }
}
