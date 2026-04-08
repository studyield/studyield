import { Module } from '@nestjs/common';
import { ProblemSolverService } from './problem-solver.service';
import { ProblemSolverController } from './problem-solver.controller';
import { ProblemSolverGateway } from './problem-solver.gateway';
import { AnalysisAgent } from './agents/analysis.agent';
import { SolverAgent } from './agents/solver.agent';
import { VerifierAgent } from './agents/verifier.agent';
import { HintAgent } from './agents/hint.agent';
import { AlternativeMethodAgent } from './agents/alternative-method.agent';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [ProblemSolverController],
  providers: [
    ProblemSolverService,
    ProblemSolverGateway,
    AnalysisAgent,
    SolverAgent,
    VerifierAgent,
    HintAgent,
    AlternativeMethodAgent,
  ],
  exports: [ProblemSolverService],
})
export class ProblemSolverModule {}
