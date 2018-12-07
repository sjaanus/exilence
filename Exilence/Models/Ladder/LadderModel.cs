using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Exilence.Models.Ladder
{ 
    [Serializable]
    public class LadderModel
    {
        public List<LadderPlayerModel> OverallLadder { get; set; }
        public List<LadderPlayerModel> ClassLadder { get; set; }
        public List<LadderPlayerModel> DepthSoloLadder { get; set; }
        public List<LadderPlayerModel> DepthGroupLadder { get; set; }
    }
}
