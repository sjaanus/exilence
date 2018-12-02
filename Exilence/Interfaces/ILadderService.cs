using Exilence.Models;
using Exilence.Models.Ladder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Exilence.Interfaces
{
    public interface ILadderService
    {
        List<LadderPlayerModel> GetLadderForPlayer(string league, string character);
        List<LadderPlayerModel> GetClassLadderForPlayer(string league, string character);
        List<LadderPlayerModel> GetSoloDepthLadderForPlayer(string league, string character);
        List<LadderPlayerModel> GetGroupDepthLadderForPlayer(string league, string character);
        List<LadderPlayerModel> GetLadderForLeague(string league, bool full = false);
        void UpdateLadders();
    }
}
