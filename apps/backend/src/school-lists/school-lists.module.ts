import { Module } from '@nestjs/common';
import { SchoolListsService } from './school-lists.service';
import { SchoolListsController } from './school-lists.controller';

@Module({
  controllers: [SchoolListsController],
  providers: [SchoolListsService],
  exports: [SchoolListsService],
})
export class SchoolListsModule {}
